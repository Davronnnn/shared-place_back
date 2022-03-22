const express = require('express');
const HttpError = require('../model/http-error');
const { check } = require('express-validator');

const placeController = require('../controllers/place-controller');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');
const router = express.Router();

router.get('/:pid', placeController.getPlaceById);
router.get('/users/:pid', placeController.getPlaceByUserId);

router.use(checkAuth);

router.post(
	'/',
	fileUpload.single('image'),
	[
		check('title').not().isEmpty(),
		check('description').isLength({ min: 5 }),
		check('address').not().isEmpty(),
	],
	placeController.createPlace
);

router.patch(
	'/:id',
	[check('title').not().isEmpty(), check('description').isLength({ min: 5 })],
	placeController.updatePlace
);
router.delete('/:id', placeController.deletePlace);

module.exports = router;
