const express = require('express');
const app = express();
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json); // for access to client JSON requests 

app.listen(3000, () => {
    console.log('Listening on port 3000');
})