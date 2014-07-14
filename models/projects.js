var mongoose = require('mongoose')
var Schema = mongoose.Schema

var getTags = function (tags) {
	console.log("reached get");
	return tags.join(',');
}

var setTags = function(tags) {
	console.log("reached set");
	console.log(tags);
	var arr = tags.split(/,| /);
	for (var i=0; i<arr.length; i++){
		arr[i] = arr[i].trim();
		arr[i] = arr[i].toLowerCase();
	}
	return arr;
}

var ProjectSchema = new Schema({
  app_name: { type: String, default: '', trim : true },
  description: { type: String, default: '', trim : true },
  demo_link: { type: String, default: '' },
  location: { type: String, default: '' },
  technologies: { type: []},
  tags: { type: [], get: getTags, set: setTags},
  builders: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  contact: { type: String, default: '' },
  github_permis: { type: String, default: '' },
  github: { type: String, default: '' },
  personal: { type: String, default: '' },
  approved: { type: Number, default: '' },
  image: { type: String, default:''},
  submittedAt : {type: Date, default: Date.now}
})


ProjectSchema.statics = {
	list: function (cb) {
		this.find().exec(cb);
	},
	queryMultipleByName: function(arr_projects, cb) {
		this.find({app_name: {$in: arr_projects}}).exec(cb);
	},

	queryById: function(id, cb) {
		this.find({_id: id}).exec(cb);
	}
}

var project = mongoose.model("Project", ProjectSchema);


module.exports = {
	Project : project
}