const express = require('express');
const HttpError = require('../model/http-error');

const userController = require('../controllers/user-controller');
const { check } = require('express-validator');
const fileUpload = require('../middleware/file-upload');
const router = express.Router();

router.get('/', userController.getUser);

router.post(
	'/signup',
	fileUpload.single('image'),
	[
		check('name').not().isEmpty(),
		check('email').normalizeEmail().isEmail(),
		check('password').isLength({ min: 5 }),
	],
	userController.signup
);

router.post('/login', userController.login);

module.exports = router;
