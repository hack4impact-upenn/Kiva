var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AchievementSchema = new Schema({
  reviewer_id: {type: Schema.Types.ObjectId},  
  achievement_text: {type: String, default: 'Text not specified'},
  points: {type: Number, default: 0},
  date: {type: Date}
});

AchievementSchema.statics = {
  
};

var achievement = mongoose.model("Achievement", AchievementSchema);


module.exports = {
	Achievement: achievement
};