import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from "morgan";
import connectDB from './db.config';
import userRouter from "./routes/user.route";

const app = express();
const port = 3000;

// MIDDLEWARE
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // for access to client JSON requests
app.use(morgan("dev")); // log all requests

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
