import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { addMember, getGroupMembers, getGroupNames, makeAdmin, createGroup, leaveGroup } from "../controllers/group.controller.js";

const router = express.Router();
router.post("/createGroup",protectRoute,createGroup);
router.post("/leaveGroup/:id",protectRoute,leaveGroup)
router.get("/groups",protectRoute,getGroupNames);
router.get("/members/:id",protectRoute,getGroupMembers);
router.post("/add/:id/:target",protectRoute,addMember);
router.post("/make-admin/:id/:target",protectRoute,makeAdmin);
export default router;