import mongoose from "mongoose";
import  Mongoose,{Schema } from "mongoose";

const subscriptionSchema=new Schema({
    subsriber:{
        type:Schema.Types.ObjectId,//one who is subsribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, //one whom subsriber is subscribing
         ref:"User"
    }
},{timestamps:true})

export const Subscription=mongoose.model("Subscription",subscriptionSchema )