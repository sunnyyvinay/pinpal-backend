import express, { Request, Response } from 'express';
import cors from 'cors';
import connectDB from './db.config';
import userRouter from "./routes/user.route";
import pinRouter from "./routes/pin.route";

const app = express();
const port = 3000;
const morgan = require('morgan');

// Middleware
app.use(cors());
app.use(express.json({ limit: '7mb' }));
app.use(express.urlencoded({ limit: '7mb', extended: true }));
app.use(morgan('dev'));

// Basic route
app.get('/', (req: Request, res: Response) => {
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

// Pin routes
app.use("/api/user/:user_id/pin", pinRouter);

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
