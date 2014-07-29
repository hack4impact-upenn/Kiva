var express = require('express');
var app = express();
var Project = require('./models/projects.js').Project;
var Application = require('./models/application.js').Application;
var mongoose = require("mongoose");

var uristring =
	process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL ||
	'mongodb://localhost/kiva-project';

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

app.use(express.logger("default"));
app.use( express.cookieParser() );
app.use(express.session({secret:'session'}));


app.use(express.bodyParser())
   .use(express.methodOverride())
   .use(app.router)
   .use(express.multipart());




var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

//app.get("/edit/:id", controller.edit);
//app.get("/tag/:tag", controller.filter_by_tag);
//app.post("/update", controller.update_project);

//General
app.get("/", controller.index);
app.post("/login", controller.login);

//Volunteer
app.post("/volunteer/submit-volunteer", controller.create_volunteer);
app.get("/volunteer/sign-up", controller.volunteer_signup_page);
app.get("/volunteer/home", controller.volunteer_home);
app.post("/review/create/:id", controller.create_review);
app.get("/review/edit/:id", controller.edit_review);
app.post("/review/save/:id", controller.save_review);
app.post("/review/submit/:id", controller.submit_review);


//Admin
app.get("/admin_submit", controller.submit_application);
app.post("/post-application", controller.create_application);
app.get("/admin_applications", controller.view_applications);
app.get("/admin/application/:id", controller.view_one_application);



module.exports = app