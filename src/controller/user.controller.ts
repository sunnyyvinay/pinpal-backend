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

// GET ALL USER PINS
export const getUserPins = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const pins = await pool.query(
      "SELECT * FROM users.pins WHERE user_id = $1", 
      [user_id]
    );
    if (pins.rows.length === 0) {
      return res.status(400).json({
        message: "User has no pins",
        pins: [],
      });
    }

    return res.status(200).json({
      message: "User info retrieved successfully",
      pins: pins.rows,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// ADD PIN
export const addPin = async (req: Request, res: Response) => {
  try {
    const user_id  = req.params.user_id;
    const { latitude, longitude, title, caption, photos, location_tags, visibility } = req.body;

    // check if the user has a pin at this location already
    // const pin = await pool.query(
    //   "SELECT * FROM users.pins WHERE user_id = $1 AND lat_long = $2", 
    //   [user_id, lat_long]
    // );
    // if (pin.rows.length > 0) {
    //   return res.status(400).json({
    //     message: "Pin at this location already exists for this user",
    //   });
    // }

    const newPinQuery = `
        INSERT INTO users.pins (user_id, latitude, longitude, title, caption, photos, location_tags, visibility) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
    await pool.query(newPinQuery, [user_id, latitude, longitude, title, caption, photos, location_tags, visibility]);

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

// GET PIN INFO
export const getPin = async (req: Request, res: Response) => {
  try {
    const { pin_id, user_id } = req.params;
    const pin = await pool.query(
      "SELECT * FROM users.pins WHERE pin_id = $1 AND user_id = $2", 
      [pin_id, user_id]
    );
    if (pin.rows.length === 0) {
      return res.status(400).json({
        message: "Pin does not exist",
      });
    }

    return res.status(200).json({
      message: "User info retrieved successfully",
      pin: {
        pin_id: pin.rows[0].pin_id,
        user_id: pin.rows[0].user_id,
        title: pin.rows[0].title,
        caption: pin.rows[0].caption,
        create_date: pin.rows[0].create_date,
        edit_date: pin.rows[0].edit_date,
        photos: pin.rows[0].photos,
        location_tags: pin.rows[0].location_tags,
        visibility: pin.rows[0].visibility
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

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
      const { title, caption, photos, location_tags, visibility } = req.body;
  
      // check if pin doesn't exist
      const pin = await pool.query(
        "SELECT * FROM users.pins WHERE user_id = $1 AND pin_id = $2", 
        [user_id, pin_id]
      );
      if (pin.rows.length <= 0) {
        return res.status(400).json({
          message: "Specified pin does not exist",
        });
      }
  
      const updatePinQuery = `
          UPDATE users.pins SET title = $1, caption = $2, photos = $3, location_tags = $4, visibility = $5
          WHERE user_id = $6 AND pin_id = $7 RETURNING *`;
      await pool.query(updatePinQuery, [title, caption, photos, location_tags, visibility, user_id, pin_id]);
  
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

// UPDATE PIN LOCATION
export const updatePinLocation = async (req: Request, res: Response) => {
  try {
    const { user_id, pin_id } = req.params;
    const { latitude, longitude } = req.body;

    // check if pin doesn't exist
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
          UPDATE users.pins SET latitude = $1, longitude = $2
          WHERE user_id = $3 AND pin_id = $4 RETURNING *`;
    await pool.query(updatePinQuery, [latitude, longitude, user_id, pin_id]);

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

// GET USER FRIEND REQUESTS
export const getUserRequests = async (req: Request, res: Response) => {
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

    const requests = await pool.query(
      "SELECT * FROM users.friendships WHERE target_id = $1 AND friend_status = 0", 
      [user_id]
    );

    let friend_requests = [];
    for (let i = 0; i < requests.rows.length; i++) {
      const user = await pool.query(
        "SELECT * FROM users.users WHERE user_id = $1", 
        [requests.rows[i].source_id]
      );
      friend_requests.push(user.rows[0]);
    }

    return res.status(200).json({
      message: "User friend requests retrieved successfully",
      friend_requests: friend_requests,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// GET USER FRIENDS
export const getUserFriends = async (req: Request, res: Response) => {
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

    const friends = await pool.query(
      "SELECT * FROM users.friendships WHERE friend_status = 1 AND ((target_id = $1 OR source_id = $1) OR (source_id = $1 OR target_id = $1))", 
      [user_id]
    );

    return res.status(200).json({
      message: "User friends retrieved successfully",
      friends: {
        friends: friends.rows
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// SEARCH FOR USERS (BASED ON QUERY)
export const getSearchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const searchQuery = `%${query}%`;

    const queriedUsers = await pool.query(
      "SELECT * FROM users.users WHERE username ILIKE $1 OR full_name ILIKE $1", 
      [searchQuery]
    );

    return res.status(200).json({
      message: "Queried users retrieved successfully",
      users: queriedUsers.rows
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// GET FRIEND REQUEST STATUS
export const getFriendStatus = async (req: Request, res: Response) => {
  try {
    const { user_id, target_id } = req.params;

    const status_result = await pool.query(
      "SELECT * FROM users.friendships WHERE source_id = $1 AND target_id = $2", 
      [user_id, target_id]
    );
    const status_result2 = await pool.query(
      "SELECT * FROM users.friendships WHERE target_id = $1 AND source_id = $2", 
      [user_id, target_id]
    );
    if (status_result.rows.length === 0 && status_result2.rows.length === 0) {
      return res.status(200).json({
        status: -1
      })
    } else if (status_result.rows.length === 0 && status_result2.rows.length > 0) {
      if (status_result2.rows[0].friend_status === 0) {
        return res.status(200).json({
          status: -2
        })
      } else if (status_result2.rows[0].friend_status === 1) {
        return res.status(200).json({
          status: 1
        })
      }

    } else if (status_result.rows.length > 0 && status_result2.rows.length === 0) {
      if (status_result.rows[0].friend_status === 0) {
        return res.status(200).json({
          status: 0
        })
      } else if (status_result.rows[0].friend_status === 1) {
        return res.status(200).json({
          status: 1
        })
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// CREATE A FRIEND REQUEST
export const createFriendRequest = async (req: Request, res: Response) => {
  try {
    const { user_id, target_id}  = req.params;

    const newPinQuery = `
        INSERT INTO users.friendships (source_id, target_id, friend_status) 
        VALUES ($1, $2, $3) RETURNING *`;
    await pool.query(newPinQuery, [user_id, target_id, 0]);

    return res.status(200).json({
      message: "Friend request created successfully",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error: " + error,
    });
  }
};

// ACCEPT FRIEND REQUEST
export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const { user_id, target_id } = req.params;

    const updatePinQuery = `
          UPDATE users.friendships SET friend_status = 1
          WHERE source_id = $1 AND target_id = $2 RETURNING *`;
    await pool.query(updatePinQuery, [user_id, target_id]);

    return res.status(200).json({
      message: "Friend request updated successfully",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error: " + error,
    });
  }
};

// DECLINE OR DELETE FRIEND REQUEST
export const deleteFriendRequest = async (req: Request, res: Response) => {
  try {
    const { user_id, target_id } = req.params;

    const deletePinQuery = `
        DELETE FROM users.friendships 
        WHERE (source_id = $1 AND target_id = $2) OR (target_id = $2 AND source_id = $1) RETURNING *`;
    await pool.query(deletePinQuery, [user_id, target_id]);

    return res.status(200).json({
      message: "Friend request deleted successfully",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error: " + error,
    });
  }
};