import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema({
    firstname: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20,
    },
    lastname: {
        type: String,
        minLength: 3,
        maxLength: 20,
    },
    avatar: { 
        type: String, 
        default: "https://icon-library.com/images/default-profile-icon/default-profile-icon-24.jpg" 
    },
    status: { 
        type: String, 
        default: "Hey there! I am using this chat app." 
    },
    isOnline: { 
        type: Boolean, 
        default: false 
    },
    lastSeen: { 
        type: Date, 
        default: Date.now 
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        immutable: true,
    },
    age: {
        type: Number,
        min: 10,
        max: 70,
    },
    password: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);
export default User;