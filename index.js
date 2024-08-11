const express = require('express');
const app = express();
const cors = require('cors');
const pool = require('./db.config');
const port = 3000;

// MIDDLEWARE
app.use(cors());
app.use(express.json()); // for access to client JSON requests

// ROUTES
// Create a user
app.post('/users', async (req, res) => {
    try {
        const { username, pass, profile_pic,email, phone_no, loc } = req.body;
        const newUser = await pool.query(
            "INSERT INTO users (username, pass, profile_pic, email, phone_no, loc) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", 
            [username, pass, profile_pic, email, phone_no, loc]
        );

        res.json(newUser.rows[0]);
    } catch (err) {
        console.log(err.message);
    }
})

// Update a user

// Delete a user

// Create a pin

// Update a pin

// Delete a pin



app.listen(port, () => {
    console.log('Listening on port ' + port);
})