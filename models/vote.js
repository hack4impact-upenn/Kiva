var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VoteSchema = new Schema({
  volunteer_id: {type: Schema.Types.ObjectId},
  is_upvote: {type: boolean, default: true},
  question_id: {type: Schema.Types.ObjectId},
});

var vote = mongoose.model("Vote", VoteSchema);


module.exports = {
	Vote : vote
};