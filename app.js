var express = require('express');
var app = express();
var Application = require('./models/application.js').Application;
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;

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

//other boiler plate
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

function ensure_auth(req, res, next) {
  if (req.session.logged) {
    return next();
  } else {
    res.redirect('/');
  }
}

function ensure_admin(req, res, next) {
  if (req.session.admin) {
    return next();
  } else {
    res.redirect('/');
  }
}

//General Online
app.get("/", controller.index);
app.post("/login", controller.login);
app.get("/load_application/:org_id", controller.load_application);
app.get("/logout", controller.logout);
app.get("/get_questions/:org_id", controller.get_questions);

/***** Volunteer requests ******/

<<<<<<< HEAD
//Loads data
app.get("/volunteer/get_min_reviewed_application", ensure_auth, controller.getMinReviewedApplication);
app.get("/volunteer/load", ensure_auth, controller.loadVolunteer); //loads data of a single User from session info
app.get("/volunteer/get_completed_applications", ensure_auth, controller.getCompletedApplications);
app.get("/volunteer/get_achievements", ensure_auth, controller.getAchievements);
=======
//Volunteer
app.get("/volunteer/get_min_reviewed_application", controller.get_min_reviewed_application); 
app.get("/volunteer/load", controller.load_volunteer); //loads data of a single User from session info
app.post("/volunteer/submit-volunteer", controller.create_volunteer); 
app.get("/volunteer/sign-up", controller.volunteer_signup_page); 
app.get("/volunteer/get_min_reviewed_application", controller.get_min_reviewed_application);
app.get("/volunteer/get_completed_applications", controller.get_completed_applications);
app.get("/volunteer/load", controller.load_volunteer);
app.post("/volunteer/submit-volunteer", controller.create_volunteer);
app.get("/volunteer/sign-up", controller.volunteer_signup_page);
app.get("/volunteer/home", controller.volunteer_home);
app.get("/volunteer/training", controller.volunteer_training);
app.get("/volunteer/finished-training", controller.volunteer_finished_training);
app.get("/volunteer/get_achievements", controller.get_achievements);
app.get("/volunteer/load_leaderboard", controller.load_leaderboard);
app.post("/review/create/:id", controller.create_review); // org_id here
app.get("/review/edit/:id", controller.edit_review); // review id
app.post("/review/save/:id", controller.save_review); // review id
app.get("/review/load/:id", controller.load_unfinished_review);
app.post("/review/submit/:id", controller.submit_review); // review id
app.get("/review/completed/:org_id", controller.completed_review_page); //org_id
app.get("/review/completed/load/:org_id", controller.load_completed_reviews);
app.get("/review/organization_docs/:org_id", controller.load_organization_docs);
app.get("/review/organization_data/:org_id", controller.load_organization_data);
app.get("/review/get_questions/:org_id", controller.get_questions);
app.post("/review/upvote_three_questions", controller.upvote_three_questions);
>>>>>>> 8feedebc6c0dc6afa27fdd9c91a34617bdbc6c8c


//signs up a volunteer
app.post("/volunteer/submit-volunteer", ensure_auth, controller.createVolunteer);
app.get("/volunteer/finished-training", ensure_auth, controller.volunteerFinishedTraining);

//pages
app.get("/volunteer/home", ensure_auth, controller.volunteerHome);
app.get("/volunteer/training", ensure_auth, controller.volunteerTraining);
app.get("/volunteer/sign-up", ensure_auth, controller.volunteerSignupPage);


/****** Review-related Requests ********/
app.post("/review/create/:id", ensure_auth, controller.create_review); // org_id
app.get("/review/edit/:id", ensure_auth, controller.edit_review); // review id
app.post("/review/save/:id", ensure_auth, controller.save_review); // review id
app.get("/review/load/:id", ensure_auth, controller.load_unfinished_review); //review id
app.post("/review/submit/:id", ensure_auth, controller.submit_review); // review id
app.get("/review/completed/:org_id", ensure_auth, controller.completed_review_page); //org_id
app.get("/review/completed/load/:org_id", ensure_auth, controller.load_completed_reviews);
app.get("/review/organization_data/:org_id", ensure_auth, controller.load_organization_data);
app.post("/review/create/:id", ensure_auth, controller.create_review); // org_id here
app.get("/review/edit/:id", ensure_auth, controller.edit_review); // review id
app.post("/review/save/:id", ensure_auth, controller.save_review); // review id
app.get("/review/load/:id", ensure_auth, controller.load_unfinished_review);
app.post("/review/submit/:id", ensure_auth, controller.submit_review); // review id
app.get("/review/completed/:org_id", ensure_auth, controller.completed_review_page); //org_id
app.get("/review/completed/load/:org_id", ensure_auth, controller.load_completed_reviews);
app.get("/review/organization_docs/:org_id", ensure_auth, controller.load_organization_docs);
app.get("/review/organization_data/:org_id", ensure_auth, controller.load_organization_data);
app.post("/review/upvote_three_questions", ensure_auth, controller.upvote_three_questions);

//Admin
app.get("/admin/sign-up", controller.admin_signup_page);
app.post('/admin/submit-admin', controller.create_admin);
app.get("/admin_submit", ensure_admin, controller.submit_application);
app.post("/post-application", ensure_admin, controller.create_application);
app.get("/admin_applications", ensure_admin, controller.view_applications);
app.get("/admin/application/:id", ensure_admin, controller.view_one_application);
app.get("/admin/load_application/:id", ensure_admin, controller.load_single_application);
app.post("/admin/update_application/:id", ensure_admin, controller.save_application_changes);

app.post("/admin/volunteer/approve", ensure_admin, controller.approve_volunteer);
app.post("/admin/volunteer/deny", ensure_admin, controller.deny_volunteer);
app.get("/admin/pull_applications_short", ensure_admin, controller.send_applications_short);
app.get("/admin/pull_applications_rest", ensure_admin, controller.send_applications_rest);


app.get("/admin/pull_volunteers:approval", ensure_admin, controller.send_volunteers);
app.get("/admin_submit", controller.submit_application);
app.post("/post-application", controller.create_application);
app.get("/admin_applications", controller.view_applications);
app.get("/admin/application/:id", controller.view_one_application);
app.get("/admin/load_application/:id", controller.load_single_application);
app.post("/admin/update_application/:id", controller.save_application_changes);

app.post("/admin/volunteer/approve", controller.approve_volunteer);
app.post("/admin/volunteer/deny", controller.deny_volunteer);
app.get("/admin/pull_applications_short", controller.send_applications_short);
app.get("/admin/pull_applications_rest", controller.send_applications_rest);

app.get("/admin/pull_volunteers:approval", controller.send_volunteers);
module.exports = app;

