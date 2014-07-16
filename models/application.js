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
  open_to_review: {type: Boolean, default: 1},
  reviews_in_progress: [Schema.Types.ObjectId],
  reviews_submitted: [Schema.Types.ObjectId],
  date_submitted: {type: Date, default: Date.now}
});


ApplicationSchema.statics = {
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

var application = mongoose.model("Application", ApplicationSchema);


module.exports = {
	Application : application
};