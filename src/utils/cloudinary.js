import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:  process.env.CLOUDINARY_API_SECRET
    });
    

     const uploadCloudinary=async (localFilePath)=>{
        try {
            if(!localFilePath) return null;
            //uploaad the file on cloudinary
          const responce=await  cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            //file uploaded scessfully
            console.log("file is uploaded on cloudinary",responce.url);
            return responce;
        } catch (error) {
            fs.unlink(localFilePath) //remove the locally saved temporary file. as upload operation failad
            return null;
            
        }
     }
 
    
    
    export{uploadCloudinary}
    