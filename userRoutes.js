import express from "express";
import { getUsers, getUserDues, markPaid, renewMonth } from "./userController.js";


const router = express.Router();

// ✅ All user-related APIs
router.get("/users", getUsers);
router.get("/dues/:user_id", getUserDues);
router.post("/pay", markPaid);
router.post("/renew-month", renewMonth);

export default router;
