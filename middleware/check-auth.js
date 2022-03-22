const HttpError = require('../model/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	if (req.method === 'OPTIONS') {
		return next();
	}
	try {
		const token = req.headers.authorization.split(' ')[1]; //Authorization: 'Bearer token'
		if (!token) {
			throw new Error('Authentication failed');
		}
		const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
		req.userData = { userId: decodedToken.userId };
		next();
	} catch (error) {
		return next(new HttpError('Authentication failed', 401));
	}
};
