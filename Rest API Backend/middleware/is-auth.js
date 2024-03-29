const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        const error = new Error('Not Authenticated');
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, //verify both decodes and verifies a JWT
            '***' //(Same secret key used during Sign In)
        )
    } catch (err) {
        err.statusCode = 500;
        throw err;
    }
    if (!decodedToken) { //not verified
        const error = new Error('Not Authenticated');
        error.statusCode = 401;
        throw error;
    }
    req.userId = decodedToken.userId;
    next();
}