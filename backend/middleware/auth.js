import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try{
            token = req.headers.authorization.split(' ')[1];    

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if(!req.user){
                return res.status(401).json({
                    success: false,
                    error: 'User not found',
                    statusCode: 401
                });
            }
            next();
        } catch (error) {
            console.error('Auth middleware error:', error.message);

            if(error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token has expiried or is invalid',
                    statusCode: 401
                });
            }
            return res.status(500).json({
                success: false,
                error: 'Server error',
                statusCode: 401
            });
        }
    } 
    if(!token){
        return res.status(401).json({
            success: false,
            error: 'Not authorized, no token',
            statusCode: 401
        });
    }
};

export default protect;