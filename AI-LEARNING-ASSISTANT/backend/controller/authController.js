import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d',
    });
}

export const register = async (req, res, next) => {
    try{
        const { username, email, password } = req.body;

        const userExists = await User.findOne({$or: [{ email }, { username }]});

        if(userExists){
            return res.status(400).json({
                success: false,
                error: 
                userExists.email === email ? 'Email already in use' : 'Username already in use',
                statusCode: 400
            });
        }

        const user = await User.create({
            username,
            email,
            password
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data: {
                user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
            },
            token,

        },
        message: 'User registered successfully',
        statusCode: 201
    });
    } catch(error){
        next(error);
    }
};    


export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password',
                statusCode: 400
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if(!user){
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                statusCode: 401
            });
        }

        const isMatch = await user.matchPassword(password);

        if(!isMatch){
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                statusCode: 401
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage,
                },
                token,
            },
            message: 'User logged in successfully',
            statusCode: 200,
        });
    } catch(error){
        next(error);
    }
};

export const getProfile = async (req, res, next) => {
    try{
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,  
            },
        });
    }catch(error){
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try{
        const { username, email, profileImage } = req.body;
        const user = await User.findById(req.user._id);

        if(username) user.username = username;
        if(email) user.email = email;
        if(profileImage) user.profileImage = profileImage;  

        await user.save();

        res.status(200).json({
            success: true,
            data: { 
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
            message: 'Profile updated successfully',
        });
    }
    catch(error){
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try{
        const { currentPassword, newPassword } = req.body;

        if(!currentPassword || !newPassword){
            return res.status(400).json({
                success: false,
                error: 'Please provide current and new password',
                statusCode: 400
            });
        }
        const user = await User.findById(req.user._id).select('+password');

        const isMatch = await user.matchPassword(currentPassword);

        if(!isMatch){
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect',
                statusCode: 401
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch(error){
        next(error);
    }
};


