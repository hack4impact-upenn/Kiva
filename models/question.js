var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var QuestionSchema = new Schema({
  reviewer_id: {type: Schema.Types.ObjectId},
  organization_id: {type: Schema.Types.ObjectId},
  question: {type: String, default: ''},
  votes: {type: Number, default:0},
});


QuestionSchema.statics = {
	upvote: function (question_id, cb) {
    this.update({_id: question_id},
      { $inc: {'votes': 1}}
      );
  },
  downvote: function (question_id, cb) {
    this.update({_id: question_id},
      { $inc: {'votes': -1}}
      );
  }
};

var question = mongoose.model("Question", QuestionSchema);


module.exports = {
	Question : question
};