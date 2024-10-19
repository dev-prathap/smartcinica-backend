const jwt = require('jsonwebtoken');

// Authentication middleware with enhanced logging
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    // Log the incoming token (if available)
    if (!token) {
        console.log("No token provided.");
        return res.status(401).json({ message: "Unauthorized. Token is missing." });
    }

    // Log the token for debugging
    console.log("Token received for verification:", token);

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Log token verification error
            console.log("Token verification failed:", err);
            return res.status(403).json({ message: "Forbidden. Invalid token." });
        }

        // Log the authenticated user
        console.log("Authenticated user:", user);
        req.user = user;
        
        next();
    });
};

module.exports = authenticateToken;
