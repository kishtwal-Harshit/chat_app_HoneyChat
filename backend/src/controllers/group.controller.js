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
  

  export const getGroupMembers = async (req, res) => {
    try {
        const { id: group_id } = req.params;

        // Find the group and populate all member details in one query
        const group = await Group.findById(group_id)
            .populate({
                path: 'members',
                select: '-password', // exclude password
                model: 'User' // specify the model to populate from
            })
            .lean();

        if (!group || !group.members || group.members.length === 0) {
            return res.status(200).json({ members: [] }); // Return empty array instead of error
        }

        // Return members with all their user data
        return res.status(200).json({ 
            members: group.members.map(member => ({
                _id: member._id,
                username: member.username,
                fullName: member.fullName,
                profilePic: member.profilePic,
                // include any other needed user fields
            }))
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to fetch group members" });
    }
};

export const makeAdmin = async(req,res)=>{

    try{
        //console.log("here")
        const user = req.user._id;
        const {id : group_id, target : target_user} = req.params;
       
        //console.log(group_id);
        //console.log(target_user);
        const group = await Group.findById(group_id);
        const isUserAdmin = group['admins'].includes(user);

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

export const isAdmin = async(req,res)=>{

    try{
        const user = req.user._id;
        const {id : groupId,id1 : userId} = req.params;
        
        const group = await Group.findById(groupId);
       // console.log("--------cur person : ",userId);
        //console.log("---------group info : ",group);
        const isAdmin = group['admins'].includes(userId);
        //console.log(group['admins'].includes(userId));
        if(isAdmin) return res.status(200).json({isAdmin : true});
        else return res.status(200).json({isAdmin : false});

    }
    catch(error){
        return res.status(500).json({error : "Internal server error in fetching admin status"});
    }
}

export const getAdmins = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const group = await Group.findById(groupId).populate("admins", "_id");
    res.status(200).json({ admins: group.admins });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};

export const removeFromGroup = async (req,res)=>{

    try{
        const user = req.user._id;
        const {id : group_id, target : target_user} = req.params;
        //console.log(group_id);
        //console.log(target_user);
        const group = await Group.findById(group_id);
        const isUserAdmin = group['admins'].includes(user);

        if(!isUserAdmin) return res.status(400).json({error : "user is not admin and cannot remove other users"});
        
        const isTargetUserinGroup = group['members'].includes(target_user.toString());

        if(!isTargetUserinGroup) return res.status(400).json({error : "cant remove user as intended user is not a part of the group"});

        const isTargetUserAdmin = group['admins'].includes(target_user);
        if(isTargetUserAdmin) return res.status(400).json({error : "cant remove user as user is also an admin"});

        const removeUser = await Group.findByIdAndUpdate(
            group_id,
            {
            
                $pull : {members : target_user}
            },
            {new : true,}
        );

        if(!removeUser) return res.status(400).json({error : "error in removing user"});

        return res.status(200).json({message : "sucessfully removed user"})
    } catch(error){
        return res.status(500).json({error : "internal server error in removing user"});
    }
};

export const groupSize = async (req,res)=>{
    
    try{
        const {id : group_id} = req.params;
        //console.log(group_id);
        const group = await Group.findById(group_id);
        const groupSize = group['members'].length;
        //console.log(groupSize);
        return res.status(200).json({size : groupSize});

    } catch(error){
        return res.status(500).json({error : "internal server error in fetching group size"});
    }
};
