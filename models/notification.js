var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationSchema = new Schema({
  reviewer_id: {type: Schema.Types.ObjectId},  
  notification_text: {type: String, default: 'Text not specified'},
  points: {type: Number, default: 0},
  date: {type: Date},
  read: {type: Boolean, default: false}
});

NotificationSchema.statics = {
  
};

var notification = mongoose.model("Notification", NotificationSchema);


module.exports = {
	Notification : notification
};