import { Router } from "express";
import { signup, login, getUserInfo, updateUserInfo, getUserPins, 
        addPin, updatePin, deletePin, getPin, updatePinLocation, 
        getUserRequests, getFriendStatus, createFriendRequest, deleteFriendRequest, acceptFriendRequest,
        getUserFriends, getSearchUsers } from "../controller/user.controller";

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

// Get all user friend requests
userRouter.get("/:user_id/requests", getUserRequests);

// Search for users (based on a query)
userRouter.get("/search/:query", getSearchUsers);

// Get friend request status
userRouter.get("/:user_id/request/:target_id/status", getFriendStatus);

// Create a friend request
userRouter.post("/:user_id/request/:target_id/create", createFriendRequest);

// Accept a friend request
userRouter.patch("/:user_id/request/:target_id/accept", acceptFriendRequest);

// Decline or Delete a friend request
userRouter.delete("/:user_id/request/:target_id/delete", deleteFriendRequest);

// Get all user friends
userRouter.get("/:user_id/friends", getUserFriends);

export default userRouter;