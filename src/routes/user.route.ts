import { Router } from "express";
import { signup, login, getUserInfo, updateUserInfo, getUserPins, 
        addPin, updatePin, deletePin, getPin, updatePinLocation } from "../controller/user.controller";

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

// Add a new pin
userRouter.post("/:user_id/pin/add", addPin);

// Get a pin
userRouter.get("/:user_id/pin/:pin_id/info", getPin);

// Update pin info
userRouter.put("/:user_id/pin/:pin_id/update", updatePin);

// Update pin location
userRouter.patch("/:user_id/pin/:pin_id/update_loc", updatePinLocation);

// Delete a pin
userRouter.delete("/:user_id/pin/:pin_id/delete", deletePin);

export default userRouter;