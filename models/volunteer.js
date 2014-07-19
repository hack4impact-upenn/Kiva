var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VolunteerSchema = new Schema({
  first_name: {type: String, default: ''},
  last_name: {type: String, default: ''},
  email_address: {type: String, default: ''},
  password: {type: String, default: ''},
  linked_in: {type: String, default: ''},
  resume_link: {type: String, default: ''},
  why_kiva: {type: String, default: ''},
  what_skills: {type: String, default: ''},
  terms_accepted: {type: Boolean, default: 1},
  approved: {type: Boolean, default: 1},
  finished_training: {type: Boolean, default: 1},
  reviews_completed: [Schema.Types.ObjectId],
  current_review: {type: Schema.Types.ObjectId},
});

//# of applications?

VolunteerSchema.statics = {
	//approve volunteer
};

var volunteer = mongoose.model("Volunteer", VolunteerSchema);


module.exports = {
	Volunteer : volunteer
};