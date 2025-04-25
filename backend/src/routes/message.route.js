import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, generateResponse, toggleBan } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

router.post("/generate", generateResponse);
//router.post("/block/:id", protectRoute,blockUser);
//router.post("/unblock/:id", protectRoute,unblockUser);
router.post("/toggle-ban/:id", protectRoute,toggleBan);

export default router;