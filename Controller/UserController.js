// Controller/UserController.js - UPDATED VERSION
import User from '../Model/UserModel.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendResetPasswordEmail } from '../utils/emailService.js';

// Get all users with pagination and search
export const GetUsers = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const {
            page = 1,
            limit = 10,
            search = '',
            role = '',
            sortBy = 'CreatedAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter
        let filter = {};
        
        if (search) {
            filter.$or = [
                { Fullname: { $regex: search, $options: 'i' } },
                { Email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (role && role !== 'all') {
            filter.Role = role;
        }

        // Sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get users
        const users = await User.find(filter)
            .select('-Password')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalUsers = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalUsers / parseInt(limit));

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalUsers,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('GetUsers Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
}

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Get total users count
        const totalUsers = await User.countDocuments();
        
        // Get today's users
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayUsers = await User.countDocuments({ CreatedAt: { $gte: today } });
        
        // Get yesterday's users
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayUsers = await User.countDocuments({ 
            CreatedAt: { $gte: yesterday, $lt: today } 
        });
        
        // Get last week's users
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekUsers = await User.countDocuments({ CreatedAt: { $gte: lastWeek } });
        
        // Get last month's users
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthUsers = await User.countDocuments({ CreatedAt: { $gte: lastMonth } });
        
        // Get role distribution
        const roleDistribution = await User.aggregate([
            {
                $group: {
                    _id: '$Role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Convert to object
        const roleStats = roleDistribution.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            message: 'User statistics retrieved',
            data: {
                totalUsers,
                todayUsers,
                yesterdayUsers,
                lastWeekUsers,
                lastMonthUsers,
                roleStats
            }
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Register new user - FRONTEND: POST /api/users/register
export const AddUser = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // Validation
        if (!fullname || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields required" 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ Email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Determine role - ankitbatviya94@gmail.com is always admin
        const userRole = email.toLowerCase() === 'ankitbatviya94@gmail.com' ? 'admin' : 'user';

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Create user
        const newUser = new User({
            Fullname: fullname.trim(),
            Email: email.toLowerCase().trim(),
            Password: hashedPassword,
            Role: userRole
        });

        const savedUser = await newUser.save();

        // Generate JWT token
        const tokenPayload = {
            userId: savedUser._id,
            email: savedUser.Email,
            fullname: savedUser.Fullname,
            role: savedUser.Role
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: {
                id: savedUser._id,
                fullname: savedUser.Fullname,
                email: savedUser.Email,
                role: savedUser.Role
            }
        });

    } catch (error) {
        console.error('AddUser Error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
}

// Login user - FRONTEND: POST /api/users/matchpassword
export const compareUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields required" 
            });
        }

        // Find user
        const findUser = await User.findOne({ Email: email.toLowerCase() });

        if (!findUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        // Compare password
        const matchPass = bcryptjs.compareSync(password, findUser.Password);
        
        if (!matchPass) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        // Auto-promote ankitbatviya94@gmail.com to admin if not already
        if (findUser.Email === 'ankitbatviya94@gmail.com' && findUser.Role !== 'admin') {
            findUser.Role = 'admin';
            await findUser.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: findUser._id,
                email: findUser.Email,
                fullname: findUser.Fullname,
                role: findUser.Role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            {
                expiresIn: '7d'
            }
        );

        // Determine redirect path based on role
        let redirectTo = '/';

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: findUser._id,
                fullname: findUser.Fullname,
                email: findUser.Email,
                role: findUser.Role
            },
            redirectTo: redirectTo
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
}

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-Password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: user
        });
    } catch (error) {
        console.error('GetProfile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

// Update user role (Admin only) - UPDATED FOR PARTNER ROLE
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Validate role - UPDATED TO INCLUDE PARTNER
        if (!['user', 'admin', 'partner'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be "user", "admin", or "partner"'
            });
        }

        // Find and update user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent modifying ankitbatviya94@gmail.com
        if (user.Email === 'ankitbatviya94@gmail.com') {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify the role of the primary admin account'
            });
        }

        // Store old role for logging
        const oldRole = user.Role;
        user.Role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User role updated from ${oldRole} to ${role}`,
            data: {
                id: user._id,
                fullname: user.Fullname,
                email: user.Email,
                oldRole,
                newRole: user.Role
            }
        });

    } catch (error) {
        console.error('UpdateRole Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

// Delete user (Admin only) - NEW FUNCTION
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { permanent = false } = req.body;

        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting ankitbatviya94@gmail.com
        if (user.Email === 'ankitbatviya94@gmail.com') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete the primary admin account'
            });
        }

        if (permanent) {
            // Hard delete - permanently remove user
            await User.findByIdAndDelete(userId);
            
            res.status(200).json({
                success: true,
                message: 'User permanently deleted',
                data: {
                    id: user._id,
                    email: user.Email,
                    fullname: user.Fullname
                }
            });
        } else {
            // Soft delete - mark user as inactive (you can add an isActive field to UserModel)
            // For now, we'll just update the email to mark as deleted
            const deletedEmail = `deleted_${Date.now()}_${user.Email}`;
            user.Email = deletedEmail;
            user.Fullname = `[Deleted User ${user._id.slice(-6)}]`;
            user.Password = '[DELETED]'; // Invalidate password
            await user.save();
            
            res.status(200).json({
                success: true,
                message: 'User deactivated successfully',
                data: {
                    id: user._id,
                    oldEmail: user.Email,
                    status: 'deactivated'
                }
            });
        }

    } catch (error) {
        console.error('DeleteUser Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

// Update UserModel to add isActive field (optional)
// Add this to your UserModel if you want proper soft delete:
/*
const userSchema = new mongoose.Schema({
    // ... existing fields ...
    isActive: {
        type: Boolean,
        default: true
    },
    // ... existing fields ...
});
*/

// Forgot password - Request reset
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findOne({ Email: email.toLowerCase() });

    if (!user) {
      // Return success even if user not found (security measure)
      return res.status(200).json({
        success: true,
        message: 'If your email exists, you will receive a reset link'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save token to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    try {
      await sendResetPasswordEmail(user.Email, user.Fullname, resetUrl);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Remove token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Reset password - Validate token
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Hash the token
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      email: user.Email
    });
  } catch (error) {
    console.error('Validate Token Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Reset password - Set new password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the token
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Update user password and clear reset token
    user.Password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate new JWT token for auto-login
    const tokenPayload = {
      userId: user._id,
      email: user.Email,
      fullname: user.Fullname,
      role: user.Role
    };

    const authToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: authToken,
      user: {
        id: user._id,
        fullname: user.Fullname,
        email: user.Email,
        role: user.Role
      }
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};