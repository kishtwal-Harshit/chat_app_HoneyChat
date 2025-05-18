import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, generateResponse, toggleBan, getFilteredUsersForSidebar } from "../controllers/message.controller.js";
import { upload } from "../middleware/multer.middleware.js"; 
const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute,upload, sendMessage);

router.post("/generate", generateResponse);
//router.post("/block/:id", protectRoute,blockUser);
//router.post("/unblock/:id", protectRoute,unblockUser);
router.post("/toggle-ban/:id", protectRoute,toggleBan);
router.get("/filteredUsers/:prefix",protectRoute,getFilteredUsersForSidebar);

export default router;