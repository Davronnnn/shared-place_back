const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../model/http-error');
const Users = require('../model/Users');

const getUser = async (req, res, next) => {
	let users;
	try {
		users = await Users.find({}, '-password');
	} catch (error) {
		return next(
			new HttpError('Fetching users failed, please try again later', 500)
		);
	}
	res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
	const validateError = validationResult(req);
	if (!validateError.isEmpty()) {
		return next(new HttpError('Invalid inputs please check data.', 422));
	}

	const { name, email, password } = req.body;

	let existingUser;
	try {
		existingUser = await Users.findOne({ email: email });

		if (existingUser) {
			return next(
				new HttpError('User already exists, please login instead.', 422)
			);
		}
	} catch (e) {
		return next(new HttpError('Signing up failed, please try again.', 500));
	}

	let hashedPassword;
	try {
		hashedPassword = await bcrypt.hash(password, 12);
	} catch (error) {
		return next(
			new HttpError('Could not create user, please try again.', 500)
		);
	}
	const newUser = await new Users({
		name,
		email,
		image: req.file.path,
		password: hashedPassword,
		places: [],
	});

	try {
		await newUser.save();
	} catch (e) {
		return next(
			new HttpError('Signing up failed, please try again.' + e, 500)
		);
	}

	let token;
	try {
		token = jwt.sign(
			{ userId: newUser.id, email: newUser.email },
			process.env.JWT_SECRET,
			{ expiresIn: '1h' }
		);
	} catch (error) {
		return next(new HttpError('Signing up failed, please try again.', 500));
	}
	res.status(201).json({
		userId: newUser.id,
		email: newUser.email,
		token: token,
	});
};

const login = async (req, res, next) => {
	const { email, password } = req.body;

	let existingUser;
	try {
		existingUser = await Users.findOne({ email: email });
	} catch (e) {
		return next(new HttpError('Logging in failed, please try again.', 500));
	}

	if (!existingUser) {
		return next(new HttpError('Invalid credentials', 403));
	}

	let isValidPassword = false;
	try {
		isValidPassword = await bcrypt.compare(password, existingUser.password);
	} catch (error) {
		return next(
			new HttpError(
				'Could not log you in, please check your password try again.',
				500
			)
		);
	}
	if (!isValidPassword) {
		return next(new HttpError('Invalid credentials', 403));
	}
	let token;
	try {
		token = jwt.sign(
			{ userId: existingUser.id, email: existingUser.email },
			process.env.JWT_SECRET,
			{ expiresIn: '1h' }
		);
	} catch (error) {
		return next(new HttpError('Signing up failed, please try again.', 500));
	}

	res.status(200).json({
		userId: existingUser.id,
		email: existingUser.email,
		token: token,
	});
};

exports.getUser = getUser;
exports.signup = signup;
exports.login = login;
