import express from "express";
const authRouter = express.Router();
import {login,logout,sendSignupOTP,verifySignupOTP} from "../controller/userAuth.js";
import userMiddleware from "../middlewere/userMiddlewere.js";
// REGISTER USER
// authRouter.post("/register",register);
// LOGIN USER 
authRouter.post("/login",login);
// LOGOUT USER
authRouter.post("/logout",logout);
authRouter.post('/register', sendSignupOTP);
authRouter.post('/verify-signup-otp', verifySignupOTP);
authRouter.get('/check', userMiddleware,(req,res)=>{
    const reply={
        firstname: req.user.firstname, // Ab yeh bhi safely use kar sakte hain
        email: req.user.email,
        _id: req.user._id
    }
     res.status(200).json({
        user:reply,
        message:"Valid User"
    });
})
export default authRouter;