import { Router } from "express";
import { addPin, deletePin, updatePin } from "../controller/pin.controller";

const pinRouter = Router();

// Add a new pin
pinRouter.post("/add", addPin);

// Update pin info
pinRouter.put("/:pin_id/update", deletePin);

// Delete a pin
pinRouter.delete("/:pin_id/delete", updatePin);

export default pinRouter;