var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReviewSchema = new Schema({
  reviewer_name: {
    first: String,
    last: String
  },
  reviewer_id: {type: Schema.Types.ObjectId},
  organization_id: {type: Schema.Types.ObjectId},
  date_review_started: {type: Date, default: Date.now},
  date_review_submitted: {type: Date},
  clear_social_impact: {type: Boolean, default: false},
  kiva_fit: {type: Boolean, default: false},
  sustainable_model: {type: Boolean, default: false},
  kiva_fit_comments: {type: String, default: ''},
  q_1: {type: String, default: ''},
  q_2: {type: String, default: ''},
  q_3: {type: String, default: ''},
  recommend_rating: {type: Number, min:1, max:5, default: 1},
  //1 is bad, 5 is good
  other_comments: {type: String, trim: true},
  submitted: {type: Boolean, default: false}
});


ReviewSchema.statics = {
	
};

var review = mongoose.model("Review", ReviewSchema);

module.exports = {
	Review : review
};