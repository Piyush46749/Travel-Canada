var mongoose = require('mongoose');
var Schema = mongoose.Schema;

searchSchema = new Schema( {
	email: String,
	search_text: String
}),

SearchHits = mongoose.model('SearchHits', searchSchema);

module.exports = SearchHits;