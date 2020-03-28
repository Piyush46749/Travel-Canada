var mongoose = require('mongoose');
var Schema = mongoose.Schema;

placesSchema = new Schema( {
	place_id: String,
    place_name: String,
    province_id: String,
    desc: String,
    img_url: String,
}),

places = mongoose.model('Places', placesSchema);

module.exports = places;