import mongoose from "mongoose";


const UpdatesSchema=
mongoose.Schema({

userid:String,    
status:String



})

const UpdatesModel=mongoose.model("updates",UpdatesSchema)
export default UpdatesModel