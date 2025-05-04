import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import Group from "../models/group.model.js";

export const createGroup = async (req,res)=>{

    try{
        const user = req.user._id;
        const {name : groupName} = req.body;

        const createGroup = await Group.create({
            name : groupName,
            members : [user],
            admins : [user],
        });

        if(!createGroup) return res.status(400).json({error : "unable to create a group"});
        return res.status(200).json({message : "group created sucessfully"});
    } catch(error){
        return res.status(500).json({error : "internal server error in creating the group"});
    }
};

export const leaveGroup = async (req,res)=>{

    try{
        const user = req.user._id;
        const {id : groupId} = req.params;
        //console.log(groupId);
        const groupLeft1 = await Group.findByIdAndUpdate(
            groupId,
            {
                $pull : {members : user},
                
            },
           
            {new : true},

        );
        const groupLeft2 = await Group.findByIdAndUpdate(
            groupId,
            {
                $pull : {admins : user},
                
            },
           
            {new : true},

        );
        /*if(groupLeft['admins'].includes(user.toString())){
            const removeAdmin = await Group.findByIdAndUpdate(
                groupId,
                {
                    $pull : {admins : user},
                },
                {
                    new : true
                },
            );
            if(!removeAdmin) return res.status(400).json({error : "unable to leave the group"});
        }*/

        if(!groupLeft1 || !groupLeft2) return res.status(400).json({error : "unable to leave the group"});
        //console.log(groupLeft1['members']);
        //console.log(groupLeft2['admins']);
        return res.status(200).json({message : "group left sucessfully"});
    } catch(error){
        return res.status(500).json({error : "internal server error in leaving the group"})
    }
}
export const getGroupNames = async (req, res) => {
    try {
      const userId = req.user._id;
  
      const groupObjs = await Group.find({ members: userId }).select("_id name");
  
      if (groupObjs.length === 0) {
        return res.status(200).json({message : "No groups found for the user" });
      }
  
      // Send back full objects with _id and name
      return res.status(200).json({ groups: groupObjs });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error in fetching group names" });
    }
  };
  

export const getGroupMembers = async(req,res)=>{

    try{

        const user = req.user._id;
        const {id : group_id} = req.params;
        const members = await Group.find({_id : group_id}).select("members");

        if(members.length===0) return res.status(400).json({error : "no members available in this group"});

        return res.status(200).json({members});

    } catch(error){
        return res.status(500).json({error : "internal server error in fetching group members"});
    }
};

export const makeAdmin = async(req,res)=>{

    try{
        const user = req.user._id;
        const {id : group_id} = req.params;
        const {target : target_user} = req.params; 
        const group = await Group.findById(group_id);
        const isUserAdmin = group['admins'].includes(user.toString());

        if(!isUserAdmin) return res.status(400).json({error : "user is not admin and cannot make others admin"});
        
        const isTargetUserinGroup = group['members'].includes(target_user.toString());

        if(!isTargetUserinGroup) return res.status(400).json({error : "cant make admin as intended user is not a part of the group"});

        const madeAdmin = await Group.findByIdAndUpdate(
            group_id,
            {
            
                $push : {admins : target_user}
            },
            {new : true,}
        );

        if(!madeAdmin) return res.status(400).json({error : "error in making user admin"});

        return res.status(200).json({message : "sucessfully made the user admin"})
    } catch(error){
        return res.status(500).json({error : "internal server error in making the user admin"});
    }
};

export const addMember = async (req, res) => {
    try {
        const user = req.user._id;
        const { id: group_id, target: target_user } = req.params;
        const target_userObj = await User.findOne({ fullName: target_user }).select("_id");
        if (!target_userObj) {
            return res.status(400).json({ error: "User not found" });
        }
        const target_userId = target_userObj._id;

        const group = await Group.findById(group_id);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const alreadyMember = group['members'].some(member => member.toString() === target_userId.toString());
        if (alreadyMember) {
            return res.status(200).json({ message: "User is already a member" });
        }

        const addedTogroup = await Group.findByIdAndUpdate(
            group_id,
            {
                $push: { members: target_userId },
            },
            { new: true }
        );

        if (!addedTogroup) {
            return res.status(400).json({ error: "User cannot be added to the group" });
        }

        return res.status(200).json({ message: "User successfully added to the group" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error in adding user to the group" });
    }
}
