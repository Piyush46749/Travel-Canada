var mongoose = require('mongoose');
var Schema = mongoose.Schema;

userSessionSchema = new Schema( {
	email: String,
    session_id: String
}),

UserSession = mongoose.model('UserSession', userSessionSchema);

module.exports = UserSession;