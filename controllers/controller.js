var Application = require('../models/application').Application;
var Volunteer = require('../models/volunteer').Volunteer;
var Review = require('../models/review').Review;
var mongoose = require('mongoose');
var SHA3 = require("crypto-js/sha3");
var async = require("async");
var fs=require('fs');
var sys=require('sys');
var credentials = require("../config.json");

var ObjectId= mongoose.Types.ObjectId;



/*--------------  General Functions ----------- */

exports.index = function(req, res) {
	res.render("index.ejs");
}

exports.login = function(req, res) {
	var email = req.body.email_address;
	var password = SHA3(req.body.password).toString();
	console.log("email is" + email);
	console.log("password is " + password);
	Volunteer.findOne({'email_address': email, 'password':password}, 
		function(err, volunteer) {
			if(volunteer != null) {
					console.log(volunteer);
					//need to add some logic in case there is no error, but there is also no data
					req.session.admin = volunteer.is_admin;
					req.session.logged = true;
					console.log("Volunteer_id to string: " + (volunteer._id).toString());
					req.session.volunteerId = ObjectId(volunteer._id.toString());
					req.session.email = volunteer.email_address;
					if(req.session.admin) {
						res.send(404);
						res.redirect('/admin/home');
					} else {
						res.redirect('/volunteer/home');
					}

				} else if (volunteer == null) {
					console.log(volunteer);
			} else {
				if(err) {
					console.log(err)
				} else {
					console.log('something went horribly wrong');
				}
				res.send(404);
			}
		});
};

/*--------------  Volunteer Story ----------------- */

//Volunteer Pages
exports.volunteer_signup_page = function(req, res) {
	res.render("volunteer_signup.ejs", {error: "lalal"});
};

exports.volunteer_home = function(req, res) {
	if(req.session.logged) {
		console.log(req.session.volunteerId);
		console.log(req.session.email);

		Application.get_min_reviewed_application(function(err, next_app) {
			console.log(next_app);
			res.render('homepage.ejs', {next_app: next_app});
		});
	} else {
		res.redirect('/');
	}
};

//open a review for editing
exports.edit_review = function(req, res) {
	if(req.session.logged){
		review_id = req.params.id;
		Review.findOne({"_id" : review_id}, function(err, review){
			if(err) {
				console.log(err);
				res.send(404);
			} else {
				Application.findOne({"_id" : review.organization_id}, function(err, application) {
					if(err) {
						console.log(err);
						res.send(404);
					}
					res.render('review.ejs', {review: review, application: application});
				});
			}
		});
	} else {
		res.redirect('/');
	}
};

//Volunteer Helper Functions

//creates new review based on org id
exports.create_review = function(req, res) {
	console.log("creating review");
	org_id = req.params.id;
	console.log(req.session.volunteerId);
	var review = new Review({
		reviewer_id: req.session.volunteerId,
		organization_id: org_id,
	});

	review.save(function(err, review) {
		console.log(review);
		console.log(review._id);
		Application.add_review_in_progress(org_id, review._id, function(err) {
			if(err) { 
				console.log(err)
			} else {
				res.redirect('/review/edit/' + review._id);
			}
		});
	});
};


exports.save_review = function(req, res) {
	console.log(req.params.id);
	Review.update({"_id": ObjectId(req.params.id)},
			{
				clear_social_impact: req.body.clear_social_impact,
				kiva_fit: req.body.kiva_fit,
				sustainable_model: req.body.sustainable_model,
				kiva_fit_comments: req.body.kiva_fit_comments,
				q_1: req.body.q_1,
				q_2: req.body.q_2,
				q_3: req.body.q_3,
				recommend_rating: req.body.recommend_rating,
				other_comments: req.body.other_comments
			}, function(err, numAffected) {
				if(err) {
					console.log(err);
					res.send(404);
				} else {
					console.log(numAffected);
					res.send(200);
				}
			}
		);
};

exports.submit_review = function(req, res) {
	//needs to mark review as submitted, remove it from review_in_progress,
	//and add it to the reviews submitted section

	var org_id = req.body.org_id;
	console.log("submitting");
	Review.update({"_id": ObjectId(req.params.id)},
		{
			submitted: true,
		}, function(err, numAffected) {
			if(err) {
				console.log(err);
				res.send(404);
			} else {
				Application.submit_review(org_id, req.params.id, function(err, numAffected2) {
					if(err) {
						console.log(err);
						res.send(404);
					} else {
						console.log(numAffected2 + "submitted in the application");
						Application.remove_review_in_progress(org_id, req.params.id, function(err, numAffected3) {
							if(err) {
								console.log(err);
								res.send(404);
							} else {
								console.log(numAffected3);
								res.send(200);
							}
						});
					}
				});
			}
		}
	);
};

exports.create_volunteer = function(req, res) {
	console.log("does this work");
	var volunteer = new Volunteer({
		first_name: req.body.first_name,
		last_name: req.body.last_name,
		email_address: req.body.email_address,
		password: SHA3(req.body.password).toString(),
		//add confirm password
		linked_in: req.body.linked_in,
		resume_link: req.body.resume_link,
		why_kiva:  req.body.why_kiva,
		what_skills: req.body.what_skills
	});
	volunteer.save(function(err, volunteer) {
		console.log(volunteer);
		if(err) {console.log(err);}
		else {
			res.redirect('/volunteer/home');
		}
	});
};

/*--------------  Admin Story ------------------ */

//Admin Pages
exports.view_applications = function(req, res) {
	Application.find( function(err, applications) {
		console.log(applications);
			return res.render("main.ejs", {applications: applications});
	});
};

exports.view_one_application = function(req, res) {
	var id = req.params.id;
	Application.find({"_id": ObjectId(id)}, function(err, application){
		console.log(application);
		return res.render("main.ejs");
	});
};

//Page: admin submit new application page
exports.submit_application = function(req, res) {
	res.render("admin_submit.ejs", {error: "lalal"});
}

//Admin Helpers

//creates new application
exports.create_application = function(req, res) {
	console.log("does this work");
	var application = new Application({
		organization_name: req.body.organization_name,
		description: req.body.description,
		token: req.body.token,
		url: req.body.url,
		organization_address: req.body.organization_address,
		organization_url: req.body.organization_url
	});

	application.save(function(err, application) {
		console.log(application);
		if(err) {console.log(err);}
		else {
			res.redirect('/admin');
		}
	});
};

//loads admin homepage
exports.admin_home = function(req, res) {

};

//loads admin signup page
exports.admin_signup_page = function(req, res) {
	res.render("admin_signup.ejs", {error: "lalal"});
};

//create admin account
exports.create_admin = function(req, res) {
	var admin = new Volunteer({
		first_name: req.body.first_name,
		last_name: req.body.last_name,
		email_address: req.body.email_address,
		password: SHA3(req.body.password).toString(),
		is_admin: true
		//add support for confirm password
	});
	/*if (password.value != password2.value) {
		console.log('Passwords do not match.');
		res.render('/');
	} else {*/
		admin.save(function(err, admin) {
			console.log(admin);
			if(err) {console.log(err);}
			else {
				res.redirect('/volunteer/home');
			}
		});
	//}
};


/*------- extra functions not used for this project -----------*/


//handles update for an edit page
/*exports.update_project = function(req, res) {

	updates = {
		app_name : req.body.app_name,
		description : req.body.description,
		demo_link : req.body.demo,
		location : req.body.location,
		technologies : req.body.technologies,
		tags : req.body.tags,
		builders : req.body.builders,
		date : req.body.date,
		contact : req.body.contact,
		github_permis : req.body.github_permis,
		github : req.body.github,
		personal : req.body.personal,
		approved : req.body.approved,
	}
	var options = {upsert: true};

	Project.findOneAndUpdate({"_id": new ObjectId(req.body.id)}, updates, options, function(err, data) {
		if(!err) {
			res.redirect("/admin");
		} 
		res.send(err);
	}); 
}

//opens edit page for a single project
exports.edit = function(req, res) {
		Project.queryById(req.params.id, function(err, project) {
			return res.render("edit.ejs", {projects: project[0]});
		});
	} */

