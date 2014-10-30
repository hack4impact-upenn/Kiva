var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ApplicationSchema = new Schema({
  organization_name: { type: String, default: '', trim : true },
  description: { type: String, default: '', trim : true },
  token: { type: String, default: '' },
  url: {type: String, default: ''},
  organization_address: { type: String, default: ''},
  organization_url: { type: String, default: '' },
  num_reviews: { type: Number, default: 0 },
  open_to_review: {type: Boolean, default: true},
  reviews_in_progress: [Schema.Types.ObjectId],
  reviews_submitted: [Schema.Types.ObjectId],
  volunteer_list: [Schema.Types.ObjectId],
  date_submitted: {type: Date, default: Date.now},
  score_sum: {type: Number, default: 0},
  kiva_fit_count: {type: Number, default: 0},
  sustainable_model_count: {type: Number, default: 0},
  clear_social_impact_count: {type: Number, default: 0}
});


ApplicationSchema.statics = {
	add_review_in_progress: function (app_id, review_id, cb) {
		this.update({ _id: app_id }, 
			{ $push: {'reviews_in_progress': review_id} }, 
			cb);
	},
	submit_review: function (app_id, review_id, cb) {
		console.log("application.submit_review reached");
		this.update({ _id: app_id }, 
			{ $push: {'reviews_submitted': review_id}, 
			$inc: {'num_reviews': 1}}, 
			cb);
	},
	remove_review_in_progress: function(app_id, review_id, cb) {
		console.log(app_id);
		this.update({ _id: app_id }, 
			{ $pull: {'reviews_in_progress': review_id}}, 
			cb);
	},
	
	get_min_reviewed_application: function(volunteer_id, cb) {
		this.findOne({"open_to_review": true, "volunteer_list": {$nin: volunteer_id}}).sort({"num_reviews":1}).exec(cb);
		}
	};

var application = mongoose.model("Application", ApplicationSchema);


module.exports = {
	Application : application
};