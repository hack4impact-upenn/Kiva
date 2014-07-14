var express = require('express');
var app = express();
var Project = require('./models/projects.js').Project;
var mongoose = require("mongoose");

var uristring =
	process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL ||
	'mongodb://localhost/express-projects';

mongoose.connect(uristring, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
  console.log ('Succeeded connected to: ' + uristring);
  }
});

//controllers
var controller = require('./controllers/controller.js');
app.use(express.static(__dirname + '/public'));


app.use(express.bodyParser())
   .use(express.methodOverride())
   .use(app.router)
   .use(express.multipart());

app.use(express.logger("default"));

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

app.get("/", controller.index);
app.get("/edit/:id", controller.edit);
app.get("/admin", controller.admin);
app.get("/submit", controller.submit);
app.get("/tag/:tag", controller.filter_by_tag);
app.post("/post", controller.create);
app.get("/search/:tag", controller.search_tags);
app.get("/searchOne/:id", controller.search_findOne);
app.post("/update", controller.update_project);
app.get("/image_upload/:id", controller.upload_page);
app.post("/upload", controller.upload);


console.log("Listening on port 3000");
module.exports = app