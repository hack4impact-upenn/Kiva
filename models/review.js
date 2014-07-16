var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReviewSchema = new Schema({
  reviewer_name: {
    first: String,
    last: String
  },
  reviewer_id: {type: Schema.type.ObjectId},
  date_review_started: {type: Date, default: Date.now},
  date_review_submitted: {type: Date},
  clear_social_impact: {type: Number, default: 3},
  //1, 2, 3 = Yes, No, Unsure
  kiva_fit: {type: Number, default: 2},
  //1 = Yes, 2 = No
  kiva_fit_comments: {type: String, default: ''},
  q_1: {type: Schema.Types.ObjectId},
  q_2: {type: Schema.Types.ObjectId},
  q_3: {type: Schema.Types.ObjectId},
  recommend_rating: {type: Number, min:1, max:5},
  //1 is bad, 5 is good
  other_comments: {type: String, trim: true}
});


ReviewSchema.statics = {
	add_review_in_progress: function (app_id, review_id, cb) {
		this.update({ _id: app_id }, 
			{ $push: {'reviews_in_progress': review_id} }, 
			cb);
	},
	submit_review: function (app_id, review_id, cb) {
		this.update({ _id: app_id }, 
			{ $push: {'reviews_submitted': review_id}}, 
			cb)	
	},
	remove_review_in_progress: function(app_id, review_id, cb) {
		this.update({ _id: app_id }, 
			{ $pull: {'reviews_in_progress': review_id}}, 
			cb);
	}
};

var review = mongoose.model("Review", ReviewSchema);


module.exports = {
	Review : review
};