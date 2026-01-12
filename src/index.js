//require('dotenv').config({path: './env'})

//or we can use

import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'

dotenv.config({
    path: './env'
})
 
 

connectDB() 
.then(()=>{
 app.listen(process.env.PORT||8000,()=>{
    console.log(`server is running at port:  ${process.env.PORT}`)
 })
})

.catch((err)=>{
    console.log("mongodb connection failed  ",err)
})
 












//m1 to connect database
 /*
 import mongoose from "mongoose";
 import { DB_NAME } from "./constants";
 import express from "express";
 const app=express();
 (async ()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

       app.on("error",(error)=>{
        console.log("err ",error)
        throw error
       })

      app.listen(process.env.PORT,()=>{
        console.log(`app is listning on port ${process.env.PORT}`);
      })
        
    } catch (error) {
        console.log("Eroor: ", error);
        throw err
        
    }
 })()
    */