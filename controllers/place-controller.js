const fs = require('fs');

const { validationResult } = require('express-validator');
const HttpError = require('../model/http-error');
const getCoords = require('../utils/location');
const Places = require('../model/Places');
const Users = require('../model/Users');
const { default: mongoose } = require('mongoose');

const getPlaceById = async (req, res, next) => {
	const pid = req.params.pid;
	let place;
	try {
		place = await Places.findById(pid);
	} catch (e) {
		const error = new HttpError(
			`Something went wrong , please try again. ${e.message} .`,
			500
		);
		return next(error);
	}

	if (!place) {
		return next(
			new Error('Could not a find a place for the provided id '),
			404
		);
	}

	res.json({ place: place.toObject({ getters: true }) });
};

const getPlaceByUserId = async (req, res, next) => {
	const uid = req.params.pid;
	// let places;
	let userWithPlaces;
	try {
		userWithPlaces = await Users.findById(uid).populate('places');
	} catch (e) {
		const error = new HttpError(
			`Something went wrong , please try again. ${e.message} .`,
			500
		);
		return next(error);
	}

	if (!userWithPlaces || userWithPlaces.length === 0) {
		return next(
			new HttpError(
				'Could not a find a place for the provided user id ',
				404
			)
		);
	}
	res.json({
		places: userWithPlaces.places.map((place) =>
			place.toObject({ getters: true })
		),
	});
};

const createPlace = async (req, res, next) => {
	const validateError = validationResult(req);
	if (!validateError.isEmpty()) {
		res.status(422);
		return next(new HttpError('Invalid inputs please check data.', 422));
	}

	const { title, description, address } = req.body;
	let coords;
	try {
		coords = await getCoords(address);
	} catch (error) {
		return next(
			'Could not get coordinates for provided address, please try again'
		);
	}

	const createdPlace = await new Places({
		title,
		description,
		location: {
			lat: coords[1],
			lng: coords[0],
		},
		address,
		image: req.file.path,
		creator: req.userData.userId,
	});

	let user;
	try {
		user = await Users.findById(req.userData.userId);
	} catch (e) {
		return next(
			new HttpError(`Creating place failed, please try again.`, 500)
		);
	}

	if (!user) {
		return next(
			new HttpError(`Could not find  user for providede id.`, 404)
		);
	}

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await createdPlace.save({ session: sess });
		user.places.push(createdPlace);
		await user.save({ session: sess });
		await sess.commitTransaction();
	} catch (e) {
		return next(
			new HttpError(`Creating place failed, please try again.`, 500)
		);
	}

	try {
		await createdPlace.save();
	} catch (e) {
		return next(
			new HttpError(`Creating place failed, please try again.`, 500)
		);
	}

	res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
	const validateError = validationResult(req);
	if (!validateError.isEmpty()) {
		console.log(validateError);
		res.status(422);
		return next(new HttpError('Invalid inputs please check data.', 422));
	}

	placeId = req.params.id;
	let updatedPlace;
	const { title, description } = req.body;

	try {
		updatedPlace = await Places.findById(placeId);
	} catch (e) {
		const error = new HttpError(
			`Something went wrong ,could not update. ${e.message} .`,
			500
		);
		return next(error);
	}
	if (updatedPlace.creator.toString() != req.userData.userId) {
		return next(
			new HttpError(`Your are not allowed to edit this place.`, 403)
		);
	}

	updatedPlace.title = title;
	updatedPlace.description = description;
	try {
		await updatedPlace.save();
	} catch (error) {}

	res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
	const id = req.params.id;

	let place;
	try {
		place = await Places.findById(id).populate('creator');
	} catch (e) {
		const error = new HttpError(
			'Someting went wrong, could not delete place',
			500
		);
		return next(error);
	}

	if (!place) {
		return next(new HttpError('Could not find place for this id', 404));
	}

	if (place.creator.id !== req.userData.userId) {
		return next(
			new HttpError('You are not allowed to delete this place', 403)
		);
	}

	const imagePath = place.image;

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await place.remove({ session: sess });
		place.creator.places.pull(place);
		await place.creator.save({ session: sess });
		await sess.commitTransaction();
	} catch (e) {
		const error = new HttpError(
			'Someting went wrong, could not delete place',
			500
		);
		return next(error);
	}

	fs.unlink(imagePath, (err) => {
		console.log(err);
	});

	res.status(200).json({ message: 'deleted Place' });
};

exports.getPlaceById = getPlaceById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
