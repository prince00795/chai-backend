import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const genrateAccessAndRefrshTokens= async(userId)=>
{
      try {
        const user=await User.findById(userId) 
        const accessToken = user.generateAccessToken()
        const refreshToken=user.generaterefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false})

        return {refreshToken,accessToken}
        
      } catch (error) {
        throw new ApiError(500,"something went wrong while genrating refreh and access token")
        
      }
}

const registerUser= asyncHandler(async (req,res)=>{
      //get user deatils from frontend
      //validation- not empty
      //check if user already exist: username,email
      //check for images check for avtar
      //upload them on cloudinry avtar
      //crate user object-cretate user entry in db
      //remove password and refreh token fields from responce
      // check for user creation
      // return res

      //get user deatils from frontend
      const{fullName,email,username,password}=req.body
     // console.log("email:",email)

      //validation- not empty
      if(
        [fullName,email,username,password].some((field)=>
            field?.trim()===""
        )
      ){
        throw new ApiError(400,"all fiels are required")
      }

      //check if user already exist: username,email
     const existedUser=await User.findOne({
        $or:[{username},{email}]
     })

     if(existedUser){
       throw new ApiError(409,"username or email already exists")
     }

      //console.log(req.files);

     //check for images check for avtar
     const avtarLocalPath=req.files?.avatar[0]?.path;
     //const coverImageLocalPath=req.files?.coverImage[0]?.path;

     let coverImageLocalPath;
     if(req.files&&Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){

        coverImageLocalPath=req.files.coverImage[0].path
     }

    if(!avtarLocalPath){
      throw new ApiError(400,"avatar file is required")
    }

      //upload them on cloudinry avtar
      const avatar=await uploadCloudinary(avtarLocalPath)
      const coverImage=await uploadCloudinary(coverImageLocalPath)

      if(!avatar){
      throw new ApiError(400,"avatar file is required")

      }
      //crate user object-cretate user entry in db
     const user= await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
      })
      // check for user creation
      //remove password and refreh token fields from responce
      const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
      )
      if(!createdUser){
        throw new ApiError(500,"something went wrong while registering ")
      }

        // return res
        return res.status(201).json(
          new ApiResponse(200,createdUser,"user registered sucessfully")
        )

})

const loginUser =asyncHandler(async (req,res)=>{
  // req body se data lenge 
  //username or email match -> password check ->acess and refresh token genrate 
  //send cookies

  const {username,password,email}=req.body

  if(!username && !email) {
    throw new ApiError(400,"username or eamil is required for login")
  }

  const user= await User.findOne(
    {$or: [{username},{email}]}
  )
  
  if(!user){
    throw new ApiError(404,"user does not exist")
  }

  const isPasswordValid =await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(401,"invalid user credentials")
  }

  const {refreshToken,accessToken}=await genrateAccessAndRefrshTokens(user._id)

  const logedInUser=await User.findById(user._id).select("-password -refreshToken ")

  const options={
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken" ,accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user: {logedInUser,refreshToken,accessToken}
      },
      " user logged in sucessfully"

    )
  )
  
})

const logoutUser=asyncHandler(async(req,res)=>{
        await User.findByIdAndUpdate(
          req.user._id,
          {
             $set:{
              refreshToken: undefined
             } 
          },
          {
            new: true
          }
        )

      const options={
      httpOnly: true,
      secure: true
      }

      return res
      .status(200)
      .clearCookie("accessToken" ,options)
      .clearCookie("refreshToken" ,options)
      .json(new ApiResponse(200,{},"User Logout successfuly"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{

  const incomingRefreshToken=req.cookies.refreshToken ||req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorised request")
  }

  try {
    const decodedToken=jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET  
    )
  
    const user=await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401,"invalid refreh token")
    }
  
    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(401,"refreh token is expired or used ")
    }
  
    const options={
      httpOnly: true,
      secure:true
  
    }
    const {newRefreshToken,accessToken}=await genrateAccessAndRefrshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken:newRefreshToken},
        "access token refreshed "
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message||"invalid refresh token")
    
  }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const{oldPassword,currrentPassword}=req.body
  const user=await User.findById(req.user?._id)
  const isPasswordCorrect=user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400,"invalid Old password")
  }
  user.password=currrentPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(new ApiResponse(200,{},"password  changed suceesfully"))

})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"user fetched succesfully")

})

const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body;
  const user=User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email:email
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(200,user,"account details updated successfully")
})

const updateUserAvatar= asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"avatar file is missing ")
  }
  const avatar=uploadCloudinary(avatarLocalPath)
  if(!avatar.url){
    throw new ApiError(400,"error while uploading on avatar")
  }
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
     $set:{
       avatar:avatar.url
     }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"avatar updated successfully"))

})

const updateUserCoverImage= asyncHandler(async(req,res)=>{
  const CoverImageLocalPath=req.file?.path

  if(!CoverImageLocalPath){
    throw new ApiError(400,"CoverImage file is missing ")
  }

  const CoverImage=uploadCloudinary(CoverImageLocalPath)
  if(!CoverImage.url){
    throw new ApiError(400,"error while uploading on CoverImage")
  }
   
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
     $set:{
       CoverImage: CoverImage.url
     }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"cover image updated successfully"))

})



export {registerUser,loginUser,logoutUser,
  refreshAccessToken,changeCurrentPassword
  ,getCurrentUser,updateAccountDetails,
updateUserAvatar,updateUserCoverImage }