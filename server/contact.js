import mongoose from "mongoose";


const ContactSchema=
mongoose.Schema({

userid:String,
phone:String,
phoneNo:String,
name:String,
image:String



})

const ContactModel=mongoose.model("contact",ContactSchema)
export default ContactModel