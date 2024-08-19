import { Router } from "express";
import { signup, login, getUserInfo, updateUserInfo } from "../controller/user.controller";

const userRouter = Router();

// Signup a new user
userRouter.post("/signup", signup);

// Login a user
userRouter.post("/login", login);

// Get user info
userRouter.get("/:user_id", getUserInfo);

// Update user info
userRouter.put("/:user_id", updateUserInfo);

export default userRouter;