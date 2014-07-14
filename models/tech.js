var mongoose = require('mongoose')
var Schema = mongoose.Schema

var TechnologySchema = new Schema({
  tag: { type: String, default: '' },
  app_name: { type: Array, default: }
})

var tech = mongoose.model("Technology", TechnologySchema);

module.exports = {
	Tech: tech
}