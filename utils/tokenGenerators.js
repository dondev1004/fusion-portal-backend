const jwt = require('jsonwebtoken');

exports.generateToken = async (user) => {
	const id = user.user_uuid;
	return await jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.generateVerifyToken = async (user) => {
	const id = user.user_uuid;
	return await jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '10m' });
}

exports.verifyToken = async (token) => {
	return await jwt.verify(token, process.env.JWT_SECRET);
}
