import { Request, Response } from "express";
import { pool } from "../db.config";
import chalk from "chalk";
const bcrypt = require("bcryptjs");

// SIGNUP USER
export const signup = async (req: Request, res: Response) => {
  try {
    const { username, full_name, pass, birthday, email, phone_no } = req.body;

    // check if user already exists
    const user = await pool.query(
      "SELECT * FROM users.users WHERE username = $1 OR phone_no = $2", 
      [email, phone_no]
    );
    if (user.rows.length > 0) {
      return res.status(400).json({
        message: "User with this username or phone number already exists",
      });
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(pass, salt);

    const newUserQuery = `
        INSERT INTO users.users (username, full_name, pass, birthday, email, phone_no) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    await pool.query(newUserQuery, [username, full_name, hashedPass, birthday, email, phone_no]);

    return res.status(200).json({
      message: "User registered successfully",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error: " + error,
    });
  }
};

// LOGIN USER
export const login = async (req: Request, res: Response) => {
  try {
    const { username, pass } = req.body;

    // check if user exists
    const user = await pool.query(
      "SELECT * FROM users.users WHERE username = $1", 
      [username]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    // compare the password
    const validPassword = await bcrypt.compare(pass, user.rows[0].pass);
    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    return res.status(200).json({
      message: "User logged in successfully",
      user: {
        user_id: user.rows[0].user_id,
        username: user.rows[0].username,
        phone_no: user.rows[0].phone_no,
      },
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// GET USER INFO
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const user = await pool.query(
      "SELECT * FROM users.users WHERE user_id = $1", 
      [user_id]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    return res.status(200).json({
      message: "User info retrieved successfully",
      user: {
        user_id: user.rows[0].user_id,
        username: user.rows[0].username,
        full_name: user.rows[0].full_name,
        pass: user.rows[0].pass,
        birthday: user.rows[0].birthday,
        email: user.rows[0].email,
        phone_no: user.rows[0].phone_no,
        profile_pic: user.rows[0].profile_picture ? user.rows[0].profile_picture : null
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// UPDATE USER INFO
export const updateUserInfo = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const { username, full_name, pass, birthday, email, phone_no, profile_pic } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(pass, salt);

    const user = await pool.query(
      "UPDATE users.users SET username = $1, full_name = $2, pass= $3, birthday = $4, email = $5, phone_no = $6, profile_pic = $7 WHERE user_id = $8 RETURNING *", 
      [username, full_name, hashedPass, birthday, email, phone_no, profile_pic, user_id]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    return res.status(200).json({
      message: "User info updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}