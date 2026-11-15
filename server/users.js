import mongoose from "mongoose";


const UsersSchema=
mongoose.Schema({

phone:String,
name:String,
image:String



})

const UsersModel=mongoose.model("users",UsersSchema)
export default UsersModel