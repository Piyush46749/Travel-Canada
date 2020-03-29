var mongoose = require('mongoose');
var Schema = mongoose.Schema;

booking_history = new Schema( {
	username: String,
	src: String,
	dest: String,
	mode: String,
	mode_company: String,
	mode_fare: String,
	mode_number: String,
	mode_id: String,
	date_of_travel: String
	}),
Booking_History = mongoose.model('booking_history', booking_history);

module.exports = Booking_History;