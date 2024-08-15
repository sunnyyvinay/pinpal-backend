import { Router } from "express";
import { signup, login } from "../controller/user.controller";

const userRouter = Router();

// Signup a new user
userRouter.post("/signup", signup);

// Login a user
userRouter.post("/login", login);

export default userRouter;