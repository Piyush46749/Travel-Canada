var mongoose = require('mongoose');
var Schema = mongoose.Schema;

provincesSchema = new Schema( {
	place_id: String,
	place_name: String,
	province_id: String,
	desc: String,
	}),
Provinces = mongoose.model('provinces', provincesSchema);

module.exports = Provinces;