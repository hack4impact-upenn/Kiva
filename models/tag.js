var mongoose = require('mongoose')
var Schema = mongoose.Schema



var setTag = function(tag) {
	var tag_clean = tag.toLowerCase();
	tag_clean = tag_clean.trim();
	return tag_clean;
}

var TagSchema = new Schema({
  tag: { type: String, set: setTag, default: '' },
  app_name: { type: String, default: ''}
})


TagSchema.statics = {
	list: function (tag_name, cb) {
		this.find({tag : tag_name}).exec(cb);
	},
	search: function(string, cb) {
	var regex = new RegExp(string, "i");
	this.distinct('tag', {'tag' : regex }).exec(cb);
	}
}

var tag = mongoose.model("Tag", TagSchema);

module.exports = {
	Tag : tag
}