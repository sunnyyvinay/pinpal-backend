import { Request, Response } from "express";
import { pool } from "../db.config";
import bcrypt from "bcrypt";

// SIGNUP USER
export const signup = async (req: Request, res: Response) => {
  try {
    const { username, full_name, pass, birthday, email, phone_no } = req.body;

    // check if user already exists
    const user = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR phone_no = $2", 
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
        INSERT INTO users (username, full_name, pass, birthday, email, phone_no) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    await pool.query(newUserQuery, [username, full_name, hashedPass, birthday, email, phone_no]);

    return res.status(200).json({
      message: "User registered successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// LOGIN USER
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // check if user exists
    const user = await pool.query(
      "SELECT * FROM users WHERE username = $1", 
      [username]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    // compare the password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    return res.status(200).json({
      message: "User logged in successfully",
      user: {
        id: user.rows[0].user_id,
        username: user.rows[0].username,
        phone_no: user.rows[0].phone_no,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};