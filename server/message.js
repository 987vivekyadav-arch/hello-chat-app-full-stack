import mongoose from "mongoose";


const MessageSchema=
mongoose.Schema({


server:String,
rece:String,
message:String



})

const MessageModel=mongoose.model("message",MessageSchema)
export default MessageModel