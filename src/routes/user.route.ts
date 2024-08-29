import { Router } from "express";
import { signup, login, getUserInfo, updateUserInfo, getUserPins } from "../controller/user.controller";

const userRouter = Router();

// Signup a new user
userRouter.post("/signup", signup);

// Login a user
userRouter.post("/login", login);

// Get user info
userRouter.get("/:user_id/info", getUserInfo);

// Update user info
userRouter.put("/:user_id/update", updateUserInfo);

// Get all pins
userRouter.get("/:user_id/pins", getUserPins);

export default userRouter;