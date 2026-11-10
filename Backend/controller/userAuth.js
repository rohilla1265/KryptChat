import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validate from "../utils/validate.js";
import redisClient from "../config/redis.js";
import nodemailer from "nodemailer"; // 👈 Nodemailer import karein

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper for 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// 1. Send OTP for Signup (Controller function)
export const sendSignupOTP = async (req, res) => {
  try {
    validate(req.body);
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { ...req.body, password: hashedPassword };

    // Redis mein OTP aur temporary user data save karein (5 mins expiry)
    await redisClient.set(`otp:${email}`, JSON.stringify({ otp, userData }));
    await redisClient.expire(`otp:${email}`, 300);

    // Email bhejein
    await transporter.sendMail({
      from: `"Krypt Secure" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Signup Verification OTP",
      html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Krypt_Secure Verification</h2>
              <p>Your one-time verification code for registration is:</p>
              <h1 style="color: #10b981; letter-spacing: 2px;">${otp}</h1>
              <p>This code will expire in <strong>5 minutes</strong>.</p>
          </div>
      `,
    });

    return res
      .status(200)
      .json({ message: "OTP sent successfully to your email" });
  } catch (e) {
    return res.status(400).json({ message: "Error: " + e.message });
  }
};

// 2. Verify OTP & Register User (Controller function)
export const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const recordData = await redisClient.get(`otp:${email}`);
    if (!recordData) {
      return res
        .status(400)
        .json({ message: "OTP expired or invalid request" });
    }

    const { otp: storedOtp, userData } = JSON.parse(recordData);

    if (storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    // OTP match ho gaya, ab User ko Database mein create karein
    const newUser = await User.create(userData);

    const reply = {
      firstname: newUser.firstname,
      email: newUser.email,
      _id: newUser._id,
      role: newUser.role,
    };

    const token = jwt.sign(
      { _id: newUser._id, email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true, 
      sameSite: "none",
    });

    // Clear OTP from redis
    await redisClient.del(`otp:${email}`);

    return res.status(201).json({
      user: reply,
      message: "User registered successfully",
    });
  } catch (err) {
    return res.status(500).json({ message: "Error: " + err.message });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const reply = {
      firstname: user.firstname,
      email: user.email,
      _id: user._id,
      role: user.role,
    };

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7 days in milliseconds matching JWT expiry
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: false, // Localhost par false hona chahiye (agar HTTPS nahi hai)
      sameSite: "lax",
    });

    return res.status(200).json({
      user: reply,
      message: "Logged in successfully",
    });
  } catch (err) {
    return res.status(500).json({ message: "Error: " + err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res
        .status(400)
        .json({ message: "No token found, already logged out" });
    }

    const payload = jwt.decode(token);
    if (payload && payload.exp) {
      await redisClient.set(`token:${token}`, "Blocked");
      await redisClient.expireAt(`token:${token}`, payload.exp);
    }

    res.clearCookie("token");
    return res.status(200).json({ message: "Logged Out Successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Error: " + err.message });
  }
};
