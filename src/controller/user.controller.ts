import { Request, Response } from "express";

// Signup a user
export const signup = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      message: "User registered successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Login a user
export const login = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      message: "User logged in successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/*
app.post('/users', async (req: Request, res: Response) => {
    try {
        const { username, pass, profile_pic, email, phone_no, loc } = req.body;
        const newUser = await pool.query(
            "INSERT INTO users (username, pass, profile_pic, email, phone_no, loc) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [username, pass, profile_pic, email, phone_no, loc]
        );

        res.json(newUser.rows[0]);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).json({ message: "Error creating user" });
    }
});
*/