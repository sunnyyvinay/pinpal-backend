import { Request, Response } from "express";
import { pool } from "../db.config";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { sendVerificationCodeService, verifyCodeService } from "../services/twilio.service";
import admin from 'firebase-admin';
const bcrypt = require("bcryptjs");

dotenv.config();
const bucketName = process.env.AWS_BUCKET_NAME || 'pinpal-images';
const bucketRegion = process.env.AWS_BUCKET_REGION || "us-west-1";
const accessKey = process.env.AWS_ACCESS_KEY ?? "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? "";

const s3 = new S3Client({
  region: bucketRegion,
  forcePathStyle: true,
  credentials: { // comment out for production
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
});

// Initialize Firebase Admin SDK if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../../pinpal-32a9b-firebase-adminsdk-y30lp-392e185cfb.json')),
  });
}

// BASIC ROUTE
export const basicRoute = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      message: "Welcome to PinPal API",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// SIGNUP USER
export const signup = async (req: Request, res: Response) => {
  try {
    const { username, full_name, pass, birthday, phone_no } = req.body;

    // check if user already exists
    const user = await pool.query(
      "SELECT * FROM users.users WHERE username = $1", 
      [username]
    );
    if (user.rows.length > 0) {
      return res.status(400).json({
        message: "User with this username already exists",
      });
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(pass, salt);

    const newUserQuery = `
        INSERT INTO users.users (username, full_name, pass, birthday, phone_no) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    await pool.query(newUserQuery, [username, full_name, hashedPass, birthday, phone_no]);

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

// SEND OTP VERIFICATION CODE
export const sendVerification = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  try {
    const response = await sendVerificationCodeService(phoneNumber);
    res.status(200).json({ success: true, message: 'Verification code sent', data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send verification code', error });
  }
}

// VERIFY OTP CODE
export const verifyCode = async (req: Request, res: Response) => {
  const { phoneNumber, code } = req.body;
  try {
    const response = await verifyCodeService(phoneNumber, code);
    if (response.status === 'approved') {
      res.status(200).json({ success: true, message: 'Phone number verified' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify code', error });
  }
}

// CHECK IF USERNAME EXISTS
export const checkUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await pool.query(
      "SELECT * FROM users.users WHERE username = $1", 
      [username]
    );
    if (user.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this username already exists",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Username is available",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// CHECK IF PHONE NO EXISTS
export const checkPhoneNo = async (req: Request, res: Response) => {
  try {
    const { phone_no } = req.params;
    const user = await pool.query(
      "SELECT * FROM users.users WHERE phone_no = $1", 
      [phone_no]
    );
    if (user.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this phone number already exists",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Phone number is available",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
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
      user: user.rows[0],
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
    const { username, full_name, pass, birthday, phone_no } = req.body;

    const user = await pool.query(
      "UPDATE users.users SET username = $1, full_name = $2, birthday = $3, phone_no = $4 WHERE user_id = $5 RETURNING *", 
      [username, full_name, birthday, phone_no, user_id]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    if (pass != "") {
      const salt = await bcrypt.genSalt(10);
      const hashedPass = await bcrypt.hash(pass, salt);
      await pool.query(
        "UPDATE users.users SET pass = $1 WHERE user_id = $2 RETURNING *", 
        [pass, user_id]
      );
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

// UPDATE USER PROFILE PIC
export const updateUserPic = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const profile_pic  = req.file?.buffer;

    let profile_pic_url = null;
    if (profile_pic) {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `profile_pics/${user_id}`,
        Body: req.file?.buffer,
        ContentType: req.file?.mimetype
      });
      await s3.send(command);
      profile_pic_url = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/profile_pics/${user_id}`;
    } else {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: `profile_pics/${user_id}`,
      });
      await s3.send(command);
    }

    const user = await pool.query(
      "UPDATE users.users SET profile_pic = $1 WHERE user_id = $2 RETURNING *", 
      [profile_pic_url, user_id]
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
      "SELECT * FROM users.pins WHERE user_id = $1 ORDER BY create_date DESC", 
      [user_id]
    );

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
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    const title = req.body.title;
    const caption = req.body.caption;
    const location_tags = req.body.location_tags ? JSON.parse(req.body.location_tags) : [];
    const visibility = req.body.visibility;
    const user_tags = req.body.user_tags ? JSON.parse(req.body.user_tags) : [];
    const photo = req.file?.buffer;

    let photo_url = null;
    const date = Date.now();
    if (photo) {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `pin_pics/${user_id}/${date}`,
        Body: req.file?.buffer,
        ContentType: req.file?.mimetype
      });
      await s3.send(command);
      photo_url = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/pin_pics/${user_id}/${date}`;
    }

    const newPinQuery = `
        INSERT INTO users.pins (user_id, latitude, longitude, title, caption, photo, location_tags, visibility, user_tags) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING pin_id`;
    await pool.query(newPinQuery, [user_id, latitude, longitude, title, caption, photo_url, location_tags, visibility, user_tags]);

    if (user_tags.length > 0) {
      const user = await pool.query(
        "SELECT * FROM users.users WHERE user_id = $1", 
        [user_id]
      );
      const senderUsername = user.rows[0].username;
      const senderFullname = user.rows[0].full_name;
      for (let i = 0; i < user_tags.length; i++) {
        const targetToken = await getDeviceToken(user_tags[i]);
        if (targetToken) {
          const message = {
            token: targetToken,
            notification: {
              title: 'PinPal',
              body: `${senderFullname} (${senderUsername}) tagged you in a pin!`,
            },
            data: {
              type: 'PIN_TAG',
              senderId: user_id,
              pinId: newPinQuery,
            },
          };
          await admin.messaging().send(message);
        }
      }
    }

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
      pin: pin.rows[0],
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

      const photo_url = (pin.rows[0].photo).replace(`https://${bucketName}.s3.${bucketRegion}.amazonaws.com/`, '');
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: photo_url,
      });
      await s3.send(command);

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
      const latitude = req.body.latitude;
      const longitude = req.body.longitude;
      const title = req.body.title;
      const caption = req.body.caption;
      const location_tags = req.body.location_tags ? JSON.parse(req.body.location_tags) : [];
      const visibility = req.body.visibility;
      const user_tags = req.body.user_tags ? JSON.parse(req.body.user_tags) : [];
      const photo = req.file?.buffer;
  
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

      const date = Date.now();
      if (photo) {
        const old_photo_url = (pin.rows[0].photo).replace(`https://${bucketName}.s3.${bucketRegion}.amazonaws.com/`, '');
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: old_photo_url,
        });
        await s3.send(command);

        const command2 = new PutObjectCommand({
          Bucket: bucketName,
          Key: `pin_pics/${user_id}/${date}`,
          Body: req.file?.buffer,
          ContentType: req.file?.mimetype
        });
        await s3.send(command2);
        let photo_url = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/pin_pics/${user_id}/${date}`;
        const updatePinQuery = `
          UPDATE users.pins SET title = $1, caption = $2, photo = $3, location_tags = $4, visibility = $5, user_tags = $6
          WHERE user_id = $7 AND pin_id = $8 RETURNING *`;
        await pool.query(updatePinQuery, [title, caption, photo_url, location_tags, visibility, user_tags, user_id, pin_id]);
      
      } else {
        const updatePinQuery = `
          UPDATE users.pins SET title = $1, caption = $2, location_tags = $3, visibility = $4, user_tags = $5
          WHERE user_id = $6 AND pin_id = $7 RETURNING *`;
        await pool.query(updatePinQuery, [title, caption, location_tags, visibility, user_tags, user_id, pin_id]);
      }
  
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

    const friends = await pool.query(
      "SELECT * FROM users.friendships WHERE friend_status = 1 AND (target_id = $1 OR source_id = $1)", 
      [user_id]
    );

    return res.status(200).json({
      message: "User friends retrieved successfully",
      friends: friends.rows
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
    const { user_id, target_id} = req.params;

    const newPinQuery = `
        INSERT INTO users.friendships (source_id, target_id, friend_status) 
        VALUES ($1, $2, $3) RETURNING *`;
    await pool.query(newPinQuery, [user_id, target_id, 0]);

    const targetToken = await getDeviceToken(target_id);

    const user = await pool.query(
      "SELECT * FROM users.users WHERE user_id = $1", 
      [user_id]
    );
    const senderUsername = user.rows[0].username;
    const senderFullname = user.rows[0].full_name;

    if (targetToken) {
      const message = {
        token: targetToken,
        notification: {
          title: 'PinPal',
          body: `${senderFullname} (${senderUsername}) sent you a friend request!`,
        },
        data: {
          type: 'FRIEND_REQUEST',
          senderId: user_id,
        },
      };
      
      await admin.messaging().send(message);
    }

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

    const targetToken = await getDeviceToken(user_id);
    const user = await pool.query(
      "SELECT * FROM users.users WHERE user_id = $1", 
      [target_id]
    );
    const targetUsername = user.rows[0].username;
    const targetFullname = user.rows[0].full_name;
    
    if (targetToken) {
      const message = {
        token: targetToken,
        notification: {
          title: 'PinPal',
          body: `${targetFullname} (${targetUsername}) accepted your friend request!`,
        },
        data: {
          type: 'FRIEND_REQUEST_ACCEPTED',
          targetId: target_id,
        },
      };
      
      await admin.messaging().send(message);
    } 
      
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

    const deleteRequestQuery = `
        DELETE FROM users.friendships 
        WHERE (source_id = $1 AND target_id = $2) OR (target_id = $1 AND source_id = $2) RETURNING *`;
    await pool.query(deleteRequestQuery, [user_id, target_id]);

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

// GET PIN LIKES
export const getPinLikes = async (req: Request, res: Response) => {
  try {
    const { pin_id } = req.params;

    const likes = await pool.query(
      "SELECT * FROM users.pin_likes WHERE pin_id = $1", 
      [pin_id]
    );

    return res.status(200).json({
      message: "Pin likes retrieved successfully",
      likes: likes.rows
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// ADD PIN LIKE
export const addPinLike = async (req: Request, res: Response) => {
  try {
    const { user_id, pin_id } = req.params;

    await pool.query(
      "INSERT INTO users.pin_likes (user_id, pin_id) VALUES ($1, $2) RETURNING *", 
      [user_id, pin_id]
    );
    const user = await pool.query(
      "SELECT * FROM users.users WHERE user_id = $1",
      [user_id]
    );
    const pin = await pool.query(
      "SELECT * FROM users.pins WHERE pin_id = $1",
      [pin_id]
    );
    const pin_user_id = pin.rows[0].user_id;
    const pin_user_token = await getDeviceToken(pin_user_id);

    const senderUsername = user.rows[0].username;
    const senderFullname = user.rows[0].full_name;
    if (pin_user_token) {
      const message = {
        token: pin_user_token,
        notification: {
          title: 'PinPal',
          body: `${senderFullname} (${senderUsername}) liked your pin!`,
        },
        data: {
          type: 'PIN_LIKE',
          userId: pin_user_id,
          pinId: pin_id,
        },
      };
      
      await admin.messaging().send(message);
    }

    return res.status(200).json({
      message: "Pin like added successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// DELETE PIN LIKE
export const removePinLike = async (req: Request, res: Response) => {
  try {
    const { user_id, pin_id } = req.params;

    const likes = await pool.query(
      "DELETE FROM users.pin_likes WHERE user_id = $1 AND pin_id = $2 RETURNING *", 
      [user_id, pin_id]
    );

    return res.status(200).json({
      message: "Pin like removed successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// GET FRIEND PINS
export const getFriendPins = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const friendData = await pool.query(
      "SELECT * FROM users.friendships WHERE friend_status = 1 AND (target_id = $1 OR source_id = $1)", 
      [user_id]
    );
    const friends = friendData.rows;
    var friendPins = [];
    for (let i = 0; i < friends.length; i++) {
      var friend_info; var friend_pins;
      if (friends[i].source_id != user_id) {
        friend_pins = await pool.query("SELECT * FROM users.pins WHERE user_id = $1", [friends[i].source_id]);
        friend_info = await pool.query("SELECT * FROM users.users WHERE user_id = $1", [friends[i].source_id]);  
      } else {
        friend_pins = await pool.query("SELECT * FROM users.pins WHERE user_id = $1", [friends[i].target_id]);
        friend_info = await pool.query("SELECT * FROM users.users WHERE user_id = $1", [friends[i].target_id]);  
      }
      for (let j = 0; j < friend_pins.rows.length; j++) {
        const pin = {user: friend_info.rows[0], pin: friend_pins.rows[j]};
        friendPins.push(pin);
      }
    }

    return res.status(200).json({
      message: "Friend pins retrieved successfully",
      pins: friendPins,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// GET PUBLIC PINS (randomly chosen for user)
export const getPublicPins = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const publicPins = await pool.query(
      "SELECT * FROM users.pins WHERE visibility = 2 AND user_id <> $1 AND user_id NOT IN (SELECT target_id FROM users.friendships WHERE source_id = $1 AND friend_status = 1) AND user_id NOT IN (SELECT source_id FROM users.friendships WHERE target_id = $1 AND friend_status = 1)", 
      [user_id]
    );
    
    var selectedPublicPins = [];
    var randomIndexes: number[] = [];
    for (let i = 0; i < publicPins.rows.length; i++) { // randomly chooses 1/3 of the public pins
      // const randomPinIndex = Math.floor(Math.random() * publicPins.rows.length);
      // if (!randomIndexes.includes(randomPinIndex)) {
      //   randomIndexes.push(randomPinIndex);
      //   selectedPublicPins.push(publicPins.rows[randomPinIndex]);
      // }
      const user = await pool.query(
        "SELECT * FROM users.users WHERE user_id = $1",
        [publicPins.rows[i].user_id]
      );
      selectedPublicPins.push({ user : user.rows[0], pin: publicPins.rows[i] });
    }
    
    return res.status(200).json({
      message: "Public pins retrieved successfully",
      pins: selectedPublicPins,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// GET TAGGED PINS
export const getTaggedPins = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const pins = await pool.query(
      "SELECT * FROM users.pins WHERE $1 = ANY(user_tags) ORDER BY create_date DESC", 
      [user_id]
    );

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

export const getUserReccFriends = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const reccFriends = await pool.query(`
      WITH current_user_friends AS (
        SELECT
            CASE
                WHEN source_id = $1 THEN target_id
                WHEN target_id = $1 THEN source_id
            END AS friend_id
        FROM users.friendships
        WHERE (source_id = $1 OR target_id = $1)
          AND friend_status = 1
      ),
      mutual_friends AS (
      SELECT 
          CASE 
              WHEN f.source_id = cf.friend_id THEN f.target_id
              WHEN f.target_id = cf.friend_id THEN f.source_id
          END AS potential_friend,
          COUNT(*) AS mutual_count
      FROM friendships f
      JOIN current_user_friends cf 
          ON (f.source_id = cf.friend_id OR f.target_id = cf.friend_id)
      WHERE (f.source_id != $1 AND f.target_id != $1)
        AND f.status = 1
      GROUP BY potential_friend
      )
      SELECT 
          potential_friend AS recommended_user_id,
          mutual_count
      FROM mutual_friends
      WHERE potential_friend NOT IN (
          SELECT friend_id FROM current_user_friends
      )
      ORDER BY mutual_count DESC
      LIMIT 5;
    `, [user_id]);

    return res.status(200).json({
      message: "Recommended friends retrieved successfully",
      reccs: reccFriends.rows,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export const getDeviceToken = async (userId: string) => {
  try {
    const result = await pool.query(
      'SELECT device_token FROM users.users WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].device_token;
    }
    return null;
  } catch (error) {
    console.error('Error getting device token:', error);
    return null;
  }
};

export const saveDeviceToken = async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { token } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE users.users SET device_token = $1 WHERE user_id = $2 RETURNING *',
      [token, user_id]
    );
    return res.status(200).json({
      success: true,
      message: 'Device token updated successfully'
    });
  } catch (error) {
    console.error('Error updating device token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update device token'
    });
  }
};