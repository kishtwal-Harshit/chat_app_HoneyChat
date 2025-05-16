import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

import path from "path"; // at the top if not already imported

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const receiver = await User.findById(receiverId);
    const isBlocked = receiver.blockedUsers.some(
      (id) => id.toString() === senderId.toString()
    );

    if (isBlocked) {
      return res
        .status(400)
        .json({ message: "You have been blocked! Unable to deliver the message" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const files = req.files?.file || [];
    const uploadedFiles = await Promise.all(
  files.map((file) => {
    const extension = path.extname(file.originalname).toLowerCase().slice(1); // e.g., 'pdf'
    const fileNameWithoutExt = path.parse(file.originalname).name;
    const isDocument = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(extension);

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: isDocument ? 'raw' : 'auto',
        public_id: fileNameWithoutExt, // This becomes public_id like `resume.pdf`
        use_filename: true,
        unique_filename: false,
      };

      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

        const url = isDocument
          ? `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment:${fileNameWithoutExt}/${result.public_id}.${extension}`
          : result.secure_url;

        resolve({
          url,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          isDocument,
        });
      });

      stream.end(file.buffer);
    });
  })
);

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      file: uploadedFiles[0],
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({createdAt : 1});

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const deleteMessage = async (req,res)=>{

  try{
    const {messageId:messageId} = req.params
    if(messageId){
      const messageDeleted = await Message.findByIdAndDelete(messageId)
      if(messageDeleted){
        const {receiverId:userToChatId} = req.params
        //const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({createdAt : 1});

    res.status(200).json(messages);

      }
      else res.status(500).json({error : "something went wrong while deleting the message"})
    }
  }
  catch(error){
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
};

/*export const blockUser = async (req,res)=>{

  try{

      const userId = req.user._id;
      const {id : blockUserId} = req.params;

      const userToBeBlockedExists = await User.findById(blockUserId);

      if(!userToBeBlockedExists) return res.status(401).json({error : "no user with this user id exists"});
      const blockUser = await User.findByIdAndUpdate(
        userId,
        {
          $push:
            {blockedUsers : blockUserId}
          
        },
        {new : true},
      );

      if(!blockUser) return res.status(501).json({error : "Falied to block the user"});

      return res.status(200).json({message : "user blocked successfully"});

  } catch(error){
    return res.status(501).json({error : "Internal server error"});
  }
};

export const unblockUser = async(req,res)=>{

  try{

      const userId = req.user._id;
      const {id : unblockUserId} = req.params;

      const userToBeUnblockedExists = await User.findById(unblockUserId);
      if(!userToBeUnblockedExists) return res.status(401).json({error : "no user with this user id exists"});

      const unblockUser = await User.findByIdAndUpdate(
        userId,
        {
          $pull:
           {blockedUsers : unblockUserId}
        },
        {new: true},
      );

      if(!unblockUser) return res.status(501).json({error : "Falied to unblock the user"});

      return res.status(200).json({message : "user unblocked successfully"});
    

  } catch(error){
    return res.status(501).json({error : "Internal server error"});
  }
};*/

export const toggleBan = async (req,res)=>{

    try{
      const userId = req.user._id;
      const {id : targetUser} = req.params;
      
      const user = await User.findById(userId);

      const isBlocked = user['blockedUsers'].includes(targetUser);
      
      if(isBlocked){
        const unblockUser = await User.findByIdAndUpdate(
          userId,
          {
            $pull:
             {blockedUsers : targetUser}
          },
          {new: true},
        );
  
        if(!unblockUser) return res.status(501).json({error : "Falied to unblock the user"});
  
        return res.status(200).json({message : "user unblocked successfully"});
      }
      else{
        const blockUser = await User.findByIdAndUpdate(
          userId,
          {
            $push:
              {blockedUsers : targetUser}
            
          },
          {new : true},
        );
  
        if(!blockUser) return res.status(501).json({error : "Falied to block the user"});
  
        return res.status(200).json({message : "user blocked successfully"});
      }

    } catch(error){
      return res.status(501).json({error : "Internal server error"});
    }
};