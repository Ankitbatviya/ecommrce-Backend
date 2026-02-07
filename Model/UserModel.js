// Model/UserModel.js
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    Fullname: {
        type: String,
        required: true,
        trim: true
    },
    Email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    Password: {
        type: String,
        required: true
    },
    Role: {
        type: String,
        enum: ['user', 'admin','partner'],
        default: 'user'
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    CreatedAt: {
        type: Date,
        default: Date.now
    }
})

// Add index for better query performance
userSchema.index({ Email: 1 });

const User = mongoose.model("User", userSchema);

export default User;