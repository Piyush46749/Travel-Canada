var mongoose = require('mongoose');
var Schema = mongoose.Schema;

touristPlaces = new Schema( {
	place_id: String,
	place_name: String,
	province_id: String,
	desc: String,
	}),
Tourism = mongoose.model('places', touristPlaces);

module.exports = Tourism;