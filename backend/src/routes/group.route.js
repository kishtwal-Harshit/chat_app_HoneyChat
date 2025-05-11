import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { addMember, getGroupMembers, getGroupNames, makeAdmin, createGroup, leaveGroup, isAdmin, getAdmins, removeFromGroup, groupSize } from "../controllers/group.controller.js";

const router = express.Router();
router.post("/createGroup",protectRoute,createGroup);
router.post("/leaveGroup/:id",protectRoute,leaveGroup)
router.get("/groups",protectRoute,getGroupNames);
router.get("/members/:id",protectRoute,getGroupMembers);
router.post("/add/:id/:target",protectRoute,addMember);
router.post("/makeAdmin/:id/:target",protectRoute,makeAdmin);
router.get("/isAdmin/:id/:id1",protectRoute,isAdmin);
router.get("/admins/:id",protectRoute,getAdmins);
router.post("/remove/:id/:target",protectRoute,removeFromGroup);
router.get("/groupSize/:id",protectRoute,groupSize);
export default router;