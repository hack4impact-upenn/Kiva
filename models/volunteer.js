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
  approved: {type: Boolean, default: 0}, // false - not processed; true - approved; null - denied
  finished_training: {type: Boolean, default: false},
  reviews_completed: [Schema.Types.ObjectId],
  current_review: {type: Schema.Types.ObjectId, default: null},
  is_admin: {type: Boolean, default: false},
  num_points: { type: Number, default: 0 },

});

//# of applications?

VolunteerSchema.statics = {
	//approve volunteer
  //check if volunteer has a review open
  add_review_in_progress: function (volunteer_id, review_id, cb) {
    this.update({ _id: volunteer_id },
      { $set: {'current_review': review_id} },
      cb);
  },

  remove_review_in_progress: function (volunteer_id, cb) {
    this.update({ _id: volunteer_id },
      { $set: {'current_review': null} },
      cb);
  }
};

var volunteer = mongoose.model("Volunteer", VolunteerSchema);


module.exports = {
	Volunteer : volunteer
};