const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if(err.name == "CastError"){
        statusCode = 400;
        message = `Resource not found. Invalid: ${err.path}`;
    }

    if(err.code === 11000){
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists. Please use another value.`;
        statusCode = 400;
    }

    if(err.name === "ValidationError"){
        message = Object.values(err.errors).map(val => val.message).join(", ");
        statusCode = 400;
    }

    if(err.code === "LIMIT_FILE_SIZE"){
        message = "File size is too large. Maximum limit is 10MB.";
        statusCode = 400;
    }

    if(err.name === "JsonWebTokenError"){
        message = "Inavalid token";
        statusCode = 401;
    }

    if(err.name  === 'TokenExpiredError'){
        message = "Token expired";
        statusCode = 401;
    }

    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    res.status(statusCode).json({
        success: false,
        error: message,
        statusCode,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export default errorHandler;