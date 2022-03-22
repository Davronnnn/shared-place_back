const { default: axios } = require('axios');
const request = require('request');

const getCoords = async (address) => {
	var url =
		'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
		encodeURIComponent(address) +
		'.json?access_token=' +
		process.env.MAPBOX_KEY +
		'&limit=1';

	const res = await axios.get(url);

	return res.data.features[0].center;
};

module.exports = getCoords;
