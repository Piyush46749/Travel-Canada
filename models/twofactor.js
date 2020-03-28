var mongoose = require('mongoose');
var Schema = mongoose.Schema;

twoFactorAuthSchema = new Schema( {
	email: String,
	otp: String
}),

TwoFactorAuth = mongoose.model('TwoFactor', twoFactorAuthSchema);

module.exports = TwoFactorAuth;