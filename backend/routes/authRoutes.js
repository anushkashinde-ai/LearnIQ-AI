import express from 'express';
import { body, validationResult } from 'express-validator';
import {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
} from '../controller/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: errors.array()[0].msg,
            statusCode: 400,
        });
    }

    next();
};

const registerValidation = [
    body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
    body('email')
    .isEmail()  
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const loginValidation = [
    body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router
