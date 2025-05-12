/*
Transfer from local machine to EC2 instance: rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.env' \
-e "ssh -i ~/.ssh/sunny-mbp.pem" \
. ubuntu@ec2-13-52-211-219.us-west-1.compute.amazonaws.com:~/pinpal

Apply changes on EC2 instance: 
    1. npm run build
    2. pm2 restart pinpal-api
    3. sudo systemctl restart pinpal.service
*/

import express, { Request, Response } from 'express';
import connectDB from './db.config';
import userRouter from "./routes/user.route";

const app = express();
const port = 3000;
const morgan = require('morgan');
const cors = require('cors');

// Middleware
app.use(cors({origin: '*', credentials: '*'}));
app.use(express.json({ limit: '7mb' }));
app.use(express.urlencoded({ limit: '7mb', extended: true }));
app.use(morgan('dev'));

// Basic route
app.get('/', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
        return res.status(200).json({
            message: "Welcome to PinPal API",
        });
    } catch (error) {
        return res.status(500).json({
            message: { "Internal Server Error": (error as Error).message },
        });
    }
});

// User routes
app.use("/api/user", userRouter);

// Unknown route
app.use((req: Request, res: Response) => {
    return res.status(404).json({
        message: "Route not found",
    });
});

app.listen(port, async () => {
    console.log(`Listening on port ${port}`);
    await connectDB();
});
