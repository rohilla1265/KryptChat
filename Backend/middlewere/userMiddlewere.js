import jwt from "jsonwebtoken";
import redisClient from "../config/redis.js";
import User from "../models/user.js";

export default async function userMiddleware(req, res, next) {
    try {
        const { token } = req.cookies;
        // console.log(token);
        if (!token) {
            throw new Error("Token is not found");
        }

        // 1. JWT Secret Log
        // console.log("1. JWT_SECRET exists?:", !!process.env.JWT_SECRET);
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        
        const { _id } = payload;
        // console.log("2. Decoded User ID:", _id);
        if (!_id) {
            throw new Error("Invalid Tokens");
        }

        // 2. Database User Search Log
        const result = await User.findById(_id);
        // console.log("3. User found in DB?:", !!result);
        if (!result) {
            throw new Error("User Doesn't Exist");
        }

        // 3. Redis Check Log
        const IsBlocked = await redisClient.exists(`token:${token}`);
        // console.log("4. Is token in Redis Blocklist?:", IsBlocked);
        if (IsBlocked) {
            throw new Error("Invalid Token");
        }

        req.user = result;
        next();

    } catch (err) {
        // EXACT ERROR PRINT KAREIN
        // console.log("Middleware Catch Error:", err.message);
        // 'return' add karne se response ke baad code aage nahi chalega
        return res.status(401).send("Error: " + err.message);
    }
}