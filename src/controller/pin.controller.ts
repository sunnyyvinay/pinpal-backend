import { Request, Response } from "express";
import { pool } from "../db.config";
import chalk from "chalk";
const bcrypt = require("bcryptjs");

// ADD PIN
export const addPin = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const { lat_long, title, caption, create_date, edit_date, photos, location_tags, user_tags } = req.body;

    // check if the user has a pin at this location already
    const pin = await pool.query(
      "SELECT * FROM users.pins WHERE user_id = $1 AND lat_long = $2", 
      [user_id, lat_long]
    );
    if (pin.rows.length > 0) {
      return res.status(400).json({
        message: "Pin at this location already exists for this user",
      });
    }

    const newPinQuery = `
        INSERT INTO users.pins (lat_long, title, caption, create_date, edit_date, photos, location_tags, user_tags) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    await pool.query(newPinQuery, [lat_long, title, caption, create_date, edit_date, photos, location_tags, user_tags]);

    return res.status(200).json({
      message: "Pin created successfully",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error: " + error,
    });
  }
};

// DELETE PIN
export const deletePin = async (req: Request, res: Response) => {
    try {
      const { user_id, pin_id } = req.params;
  
      // check if pin exists
      const pin = await pool.query(
        "SELECT * FROM users.pins WHERE user_id = $1 AND pin_id = $2", 
        [user_id, pin_id]
      );
      if (pin.rows.length <= 0) {
        return res.status(400).json({
          message: "Specified pin does not exist",
        });
      }
  
      const deletePinQuery = `
          DELETE FROM users.pins 
          WHERE user_id = $1 AND pin_id = $2 RETURNING *`;
      await pool.query(deletePinQuery, [user_id, pin_id]);
  
      return res.status(200).json({
        message: "Pin deleted successfully",
      });
  
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error: " + error,
      });
    }
  };

// UPDATE PIN
export const updatePin = async (req: Request, res: Response) => {
    try {
      const { user_id, pin_id } = req.params;
      const { lat_long, title, caption, create_date, edit_date, photos, location_tags, user_tags } = req.body;
  
      // check if user doesn't exist
      const user = await pool.query(
        "SELECT * FROM users.pins WHERE user_id = $1 AND pin_id = $2", 
        [user_id, pin_id]
      );
      if (user.rows.length <= 0) {
        return res.status(400).json({
          message: "Specified pin does not exist",
        });
      }
  
      const updatePinQuery = `
          UPDATE users.pins SET lat_long = $1, title = $2, caption = $3, create_date = $4, edit_date = $5, photos = $6, location_tags = $7, user_tags = $8
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
      await pool.query(updatePinQuery, [lat_long, title, caption, create_date, edit_date, photos, location_tags, user_tags]);
  
      return res.status(200).json({
        message: "Pin updated successfully",
      });
  
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error: " + error,
      });
    }
  };