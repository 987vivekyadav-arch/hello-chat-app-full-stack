import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import multer from "multer";
import verify from "./verify.js";
import {createServer} from "http";
import {Server} from "socket.io";

import UsersModel from "./users.js";
import ContactModel from "./Contact.js";
import MessageModel from "./message.js";
import UpdatesModel from "./updates.js";


dotenv.config();


const app = express();

const server = createServer(app);

const io = new Server(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"]
    }
});


app.use(cors());
app.use(express.json());
app.use("/uploads",express.static("uploads"));

const uploads = multer({dest:"uploads/"});


// --------------------------------------------------
// SOCKET.IO AUTHENTICATION
// --------------------------------------------------

io.use(function(socket,next){

    const token = socket.handshake.auth.token;

    if(!token){
        return next(new Error("Authentication required"));
    }

    jwt.verify(token,"secret",function(error,decoded){

        if(error){
            return next(new Error("Invalid token"));
        }

        socket.userid = decoded.userid;

        next();

    });

});


// --------------------------------------------------
// SOCKET.IO CONNECTION
// --------------------------------------------------

io.on("connection",function(socket){

    console.log("USER CONNECTED:",socket.id);
    console.log("MONGODB USER:",socket.userid);


    socket.join(String(socket.userid));


    // ----------------------------------------------
    // CALL USER
    // ----------------------------------------------

    socket.on("call-user",function(data){

        const receiverId = String(data.to);

        if(receiverId === String(socket.userid)){
            return;
        }

        io.to(receiverId).emit("incoming-call",{

            from:String(socket.userid),

            fromSocketId:socket.id

        });

        console.log("CALL REQUEST:",socket.userid,"TO:",receiverId);

    });


    // ----------------------------------------------
    // ACCEPT OR REJECT CALL
    // ----------------------------------------------

    socket.on("call-response",function(data){

        io.to(String(data.to)).emit("call-response",{

            status:data.status

        });

        console.log("CALL RESPONSE:",data.status);

    });


    // ----------------------------------------------
    // WEBRTC OFFER
    // ----------------------------------------------

    socket.on("webrtc-offer",function(data){

        io.to(String(data.to)).emit("webrtc-offer",{

            from:String(socket.userid),

            offer:data.offer

        });

        console.log("WEBRTC OFFER SENT");

    });


    // ----------------------------------------------
    // WEBRTC ANSWER
    // ----------------------------------------------

    socket.on("webrtc-answer",function(data){

        io.to(String(data.to)).emit("webrtc-answer",{

            from:String(socket.userid),

            answer:data.answer

        });

        console.log("WEBRTC ANSWER SENT");

    });


    // ----------------------------------------------
    // WEBRTC ICE CANDIDATES
    // ----------------------------------------------

    socket.on("webrtc-ice-candidate",function(data){

        io.to(String(data.to)).emit("webrtc-ice-candidate",{

            from:String(socket.userid),

            candidate:data.candidate

        });

    });


    // ----------------------------------------------
    // END CALL
    // ----------------------------------------------

    socket.on("end-call",function(data){

        io.to(String(data.to)).emit("end-call",{

            from:String(socket.userid)

        });

        console.log("CALL ENDED:",socket.userid);

    });


    // ----------------------------------------------
    // DISCONNECT
    // ----------------------------------------------

    socket.on("disconnect",function(){

        console.log("USER DISCONNECTED:",socket.id);

    });

});


// --------------------------------------------------
// DATABASE CONNECTION
// --------------------------------------------------

mongoose.connect(process.env.MONGO_URI)

.then(function(){

    console.log("MONGODB CONNECTED");

})

.catch(function(error){

    console.log("MONGODB ERROR:",error);

});


// --------------------------------------------------
// REGISTER
// --------------------------------------------------

app.post("/register",uploads.single("image"),function(req,res){

    UsersModel.find({phone:req.body.phone})

    .then(function(phone){

        if(phone.length>0){

            return res.status(409).json({

                message:"PHONE ALREADY EXISTS"

            });

        }


        return UsersModel.create({

            name:req.body.name,

            phone:req.body.phone,

            image:req.file ? "uploads/"+req.file.filename : ""

        })

        .then(function(data){

            console.log("REGISTER",data);

            res.json(data);

        });

    })

    .catch(function(error){

        console.log(error);

        res.status(500).json({

            message:"Registration failed"

        });

    });

});


// --------------------------------------------------
// LOGIN
// --------------------------------------------------

app.post("/login",function(req,res){

    UsersModel.findOne(req.body)

    .then(function(data){

        if(!data){

            return res.status(404).json({

                message:"User not found"

            });

        }


        const token = jwt.sign(

            {userid:data._id},

            "secret"

        );


        res.json({

            token:token

        });

    })

    .catch(function(error){

        console.log(error);

        res.status(500).json({

            message:"Login failed"

        });

    });

});


// --------------------------------------------------
// ADD CONTACT
// --------------------------------------------------

app.post("/add",verify,function(req,res){

    UsersModel.findOne({phone:req.body.phone})

    .then(function(phone){

        if(!phone){

            return res.status(404).json({

                message:"User not found"

            });

        }


        return ContactModel.find({

            phone:phone._id,

            userid:req.userid

        })

        .then(function(find){

            if(find.length>0){

                return res.status(409).json({

                    message:"PHONE ALREADY EXISTS"

                });

            }


            return ContactModel.create({

                userid:req.userid,

                phone:phone._id,

                phoneNo:phone.phone,

                name:phone.name,

                image:phone.image

            });

        });

    })

    .then(function(data){

        if(data){

            console.log(data);

            res.json(data);

        }

    })

    .catch(function(error){

        console.log(error);

        res.status(500).json({

            message:"Unable to add contact"

        });

    });

});


// --------------------------------------------------
// GET CONTACTS
// --------------------------------------------------

app.get("/home",verify,function(req,res){

    ContactModel.find({userid:req.userid})

    .then(function(data){

        console.log(data);

        res.json(data);

    })

    .catch(function(error){

        console.log(error);

        res.status(500).json({

            message:"Unable to get contacts"

        });

    });

});


// --------------------------------------------------
// SEND MESSAGE
// --------------------------------------------------

app.post("/message",verify,function(req,res){

    MessageModel.create({

        ...req.body,

        server:req.userid

    })

    .then(function(data){

        console.log(data);

        res.json(data);

    })

    .catch(function(error){

        console.log(error);

        res.status(500).json({

            message:"Message failed"

        });

    });

});


// --------------------------------------------------
// GET MESSAGES
// --------------------------------------------------

app.get("/message/:id",verify,function(req,res){

    console.log("LOGGED USER:",req.userid);

    console.log("RECEIVER:",req.params.id);


    MessageModel.find({

        $or:[

            {

                server:req.userid,

                rece:req.params.id

            },

            {

                server:req.params.id,

                rece:req.userid

            }

        ]

    })

    .sort({_id:1})

    .then(function(data){

        console.log("GETMESSAGE:",data);

        res.json(data);

    })

    .catch(function(error){

        console.log(error);

        res.status(500).json({

            message:"Unable to get messages"

        });

    });

});


// --------------------------------------------------
// UPLOAD STATUS
// --------------------------------------------------

app.post("/updates",verify,uploads.single("status"),function(req,res){

    UpdatesModel.find({userid:req.userid})

    .then(function(phone){

        if(phone.length>0){

            return res.status(409).json({

                message:"USER ALREADY EXISTS"

            });

        }


        return UpdatesModel.create({

            userid:req.userid,

            status:req.file ? "uploads/"+req.file.filename : ""

        })

        .then(function(data){

            console.log("Updates",data);

            res.json(data);

        });

    })

    .catch(function(error){

        console.log(error);

        res.status(500).json({

            message:"Status upload failed"

        });

    });

});


// --------------------------------------------------
// GET STATUS
// --------------------------------------------------

app.get("/updates",verify,function(req,res){

    ContactModel.find({userid:req.userid})

    .then(function(contacts){

        var userids = contacts.map(function(contact){

            return contact.phone;

        });


        userids.push(req.userid);


        return UpdatesModel.find({

            userid:{$in:userids}

        })

        .then(function(data){

            var result = data.map(function(item){

                var contact = contacts.find(function(c){

                    return String(c.phone) === String(item.userid);

                });


                return {

                    _id:item._id,

                    userid:item.userid,

                    status:item.status,

                    name:String(item.userid) === String(req.userid)

                        ? "My status"

                        : contact ? contact.name : "Unknown",

                    image:contact ? contact.image : ""

                };

            });


            console.log("NEEDED:",result);

            res.json(result);

        });

    })

    .catch(function(error){

        console.log(error);

        res.status(500).json({

            message:"Unable to get status"

        });

    });

});


// --------------------------------------------------
// FIND USER FOR CALLING
// --------------------------------------------------

app.post("/calls",verify,function(req,res){

    UsersModel.findOne({phone:req.body.phone})

    .then(function(data){

        if(!data){

            return res.status(404).json({

                message:"User not found"

            });

        }


        if(String(data._id) === String(req.userid)){

            return res.status(400).json({

                message:"You cannot call yourself"

            });

        }


        console.log("CALL USER:",data);

        res.json(data);

    })

    .catch(function(error){

        console.log(error);

        res.status(500).json({

            message:"Unable to find user"

        });

    });

});


// --------------------------------------------------
// START SERVER
// --------------------------------------------------

server.listen(5000,function(){

    console.log("SERVER RUNNING ON PORT 5000");

});