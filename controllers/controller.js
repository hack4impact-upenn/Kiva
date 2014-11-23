var Application = require('../models/application').Application;
var Volunteer = require('../models/volunteer').Volunteer;
var Review = require('../models/review').Review;
var Question = require('../models/question').Question;
var mongoose = require('mongoose');
var SHA3 = require("crypto-js/sha3");
var async = require("async");
var fs=require('fs');
var sys=require('sys');
var credentials = require("../config.json");
var sendgrid  = require('sendgrid')('hack4impact', 'dhruvmadethis1');
var request = require('request');
var ObjectId= mongoose.Types.ObjectId;



/*--------------  General Functions ----------- */

exports.index = function(req, res) {
	if(req.session.logged) {
		res.redirect('/volunteer/home');
	} else {
		res.render("index.ejs");
	}
};

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
						console.log("redirecting to volunteer homepage");
						res.redirect('/volunteer/home');
					}
				} else if (volunteer === null) {
					console.log(volunteer);
					res.render("index.ejs", {errors: "error"});
			} else {
				if(err) {
				} else {
					console.log('something went horribly wrong');
				}
				res.send(404);
			}
		});
};

//logs out
exports.logout = function(req, res) {
	req.session.logged = false;
	req.session.username = "";
	return res.redirect("/");
};

//load_application
exports.load_application = function(req, res) {
	var org_id = req.params.org_id;
	Application.findOne({"_id": ObjectId(org_id)}, function(err, application){
		console.log(application);
		res.send(application);
	});
};


/*--------------  Volunteer Story ----------------- */


exports.create_volunteer = function(req, res) {
	console.log("does this work");
    console.log(req.body.why_kiva);
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
			req.session.admin = volunteer.is_admin;
			req.session.logged = true;
			console.log("Volunteer_id to string: " + (volunteer._id).toString());
			req.session.volunteerId = ObjectId(volunteer._id.toString());
			req.session.email = volunteer.email_address;
			res.redirect('/volunteer/training');
		}
	});
};

//load volunteer
exports.load_volunteer = function(req, res) {
	console.log("ajax call is working");
	Volunteer.findOne({"_id": req.session.volunteerId}, function(err, volunteer) {
		res.send(volunteer);
	});
};



//Volunteer Pages
exports.volunteer_signup_page = function(req, res) {
	res.render("volunteer_signup.ejs", {error: "lalal"});
};

exports.volunteer_home = function(req, res) {
	if(req.session.logged) {
		console.log(req.session.volunteerId);
		console.log(req.session.email);
		res.render('homepage.ejs');
	} else {
		res.redirect('/');
	}
};

exports.volunteer_training = function(req, res) {
	if(req.session.logged) {
		console.log(req.session.volunteerId);
		console.log(req.session.email);
		res.render('training.ejs');
	} else {
		res.redirect('/');
	}
};

exports.volunteer_finished_training = function(req, res) {
	if(req.session.logged) {
		var id = req.session.volunteerId;
		console.log('volunteer id: ' + id);
		Volunteer.findOne({"_id": req.session.volunteerId}, function(err, volunteer) {
			console.log("old volunteer: " + volunteer);
			volunteer.finished_training = true;

			volunteer.save(function(err, volunteer) {
				console.log("new volunteer: " + volunteer);
				if(err) {console.log(err);}
				else {
					res.redirect('/volunteer/home');
				}
			});
		});
	} else {
		res.redirect('/');
	}
};

//TODO: 
//TODO: Then load all the questions. 
exports.completed_review_page = function(req, res) {
	org_id = req.params.org_id;
	res.render("reviewed_application.ejs", {org_id: org_id});
};

exports.get_min_reviewed_application = function(req, res) {
		console.log(req.session.volunteerId);
		Application.get_min_reviewed_application(ObjectId(req.session.volunteerId), function (err, application) {
			if(application === null) {
				res.send({"data" : "none"});
			} else {
				console.log("application: " + application);
				res.send(application);
			}
		});
	};

exports.get_completed_applications = function(req, res) {
	Review.find({"reviewer_id": req.session.volunteerId, "submitted": true}, function(err, reviews) {
		if(err) {console.log(err)}
			res.send(reviews);
	});
}


//open a review for editing
exports.edit_review = function(req, res) {
	res.render('review.ejs', {review_id: req.params.id});
};
/*	if(req.session.logged){
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
};*/

//Volunteer Helper Functions

exports.load_organization_docs = function(req, res) {
	console.log("loading application docs");
	request('https://api.myjson.com/bins/1a2tl', function (error, response, body) {
	  	if (!error && response.statusCode == 200) {
	    	res.json(body)
	    }
	});
}

exports.load_organization_data = function(req, res) {
	console.log("loading organization data");
	Application.findById(req.params.org_id, function(err, application) {
		return res.json(application);
	});
}

exports.get_questions = function(req, res) {
	var org_id = req.params.org_id;
	Question.find({"organization_id": org_id}, function(err, questions) {
		return res.json(questions)
	});
}

exports.upvote_three_questions = function(req, res) {
	questions = req.body.box;
	var count = 0;
	for (var id in req.body.box) {
		Question.upvote(id, function(err) {
			if (err) { 
				console.log("error in upvoting question");
				return callback(err)
			};
			count++;
			console.log(count);
			if (count == 3) {
				return res.redirect('/');
			}
		});
	}
}

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
				console.log(err);
			} else {
				Volunteer.add_review_in_progress(req.session.volunteerId, review._id, function(err) {
					if(err) {
						console.log(err);
						res.send(404);
					} else {
						console.log("review saved");
						res.redirect('/review/edit/' + review._id);
					}
				});
			}
		});
	});
};

exports.load_unfinished_review = function(req, res) {
	Review.findById(req.params.id, function(err, review) {
		if(err) {
			console.log(err);
			res.send(404);
		} else {
			res.send(review);
		}
	})
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
					res.redirect('/review/edit/' + req.params.id);
				}
			}
		);
};

exports.submit_review = function(req, res) {
	//TODO: Add the review to the user's submitted list
	//TODO: This is massive. refactoring needed?
	var org_id = req.body.organization_id;
	console.log(org_id);
	console.log("submitting");
	async.parallel(
		[
			function(callback) {
				//save review
				Review.update({
					"_id": ObjectId(req.params.id)},{
						submitted: true,
						date_review_submitted: Date.now(),
						clear_social_impact: req.body.clear_social_impact,
						kiva_fit: req.body.kiva_fit,
						sustainable_model: req.body.sustainable_model,
						kiva_fit_comments: req.body.kiva_fit_comments,
						q_1: req.body.q_1,
						q_2: req.body.q_2,
						q_3: req.body.q_3,
						recommend_rating: req.body.recommend_rating,
						other_comments: req.body.other_comments
					}, function(err) {
						if (err) {return callback(err)};
						console.log("review marked as submitted");
						callback();
					});
			},
			
			//in Application: add to submitted list
			function(callback) {
				Application.submit_review(org_id, req.params.id, function(err) {
						if (err) { console.log("error in application_submit review");
							return callback(err)};
						console.log("review added to application's submitted list");
						callback();
					});
			},
			//in Application: add to volunteers list
			function(callback) {
				Application.update({_id: org_id},
								{ $push: {"volunteer_list": req.session.volunteerId}}, function(err){
									if(err) {console.log("error in adding to volunteer list")
											return callback(err);
									}
									callback()
								})							
				},
			//in Application: move from in_progress
			function(callback) {
				Application.remove_review_in_progress(org_id, req.params.id, function(err) {
						if (err) {return callback(err)};
						console.log("review removed from application current list");
						callback();
					});
			},
			function(callback) {
				//in Volunteer: remove from in_progress

				Volunteer.remove_review_in_progress(req.session.volunteerId, function(err) {
						if (err) {return callback(err)};
					console.log("review removed from volunteer's current list");
						callback();
					});
			},
			function(callback) {
					//save q_1
					var q_1 = new Question({
						reviewer_id: req.session.volunteerId,
						organization_id: org_id,
						question_text: req.body.q_1,
					});
					//TODO: do we have to edit the q in the review to make it point to the q_id?
					q_1.save(function(err, question) {
						if (err) {return callback(err)};
						console.log("q1 saved");
						callback(err);
					});
			},
			function(callback) {
					//save q_2
					var q_2 = new Question({
						reviewer_id: req.session.volunteerId,
						organization_id: org_id,
						question_text: req.body.q_2,
					});
					//TODO: do we have to edit the q in the review to make it point to the q_id?
					q_2.save(function(err, question) {
						if (err) {return callback(err)};
						console.log("q2 saved");
						callback(err);
					});
			},
			function(callback) {
					//save q_3
					var q_3 = new Question({
						reviewer_id: req.session.volunteerId,
						organization_id: org_id,
						question_text: req.body.q_3,
					});
					//TODO: do we have to edit the q in the review to make it point to the q_id?
					q_3.save(function(err, question) {
						if (err) {return callback(err)};
						console.log("q3 saved");
						callback(err);
					});
			},
			function(callback) {
				//update average score/counts
				console.log(req.body.kiva_fit);
				var kiva_fit = (req.body.kiva_fit === 'true' ? 1 : 0); 
				var clear_social_impact = (req.body.clear_social_impact === 'true' ? 1 : 0); 
				var sustainable_model = (req.body.sustainable_model === 'true' ? 1 : 0); 
				console.log("kiva fit:" + kiva_fit);

				Application.update({"_id": org_id}, 
					{$inc: {score_sum: req.body.recommend_rating,
							kiva_fit_count: kiva_fit, 
							sustainable_model_count: sustainable_model, 
							clear_social_impact_count: clear_social_impact}
						}, function(err) {
					if (err) {return callback(err)};
					console.log("score updated");
					callback(err);
				})
			},
		], function(err) {
			if (err) {res.send(404);};
			console.log("submission complete");
			res.redirect('/review/completed/' + org_id);
		});
	};


exports.load_completed_reviews = function(req, res) {
	var org_id = req.params.org_id;
	Review.find({"organization_id": org_id, "submitted": true}, function(err, reviews) {
		if(err) {console.log(err)}
			res.send(reviews);
	});
};



/*--------------  Admin Story ------------------ */





//Admin Pages
exports.view_applications = function(req, res) {
	res.render("main.ejs", {error: "lalal"});	
};



exports.send_applications_short= function(req, res) {
	Application.find( {"shortlisted": true}, {"_id": 1, "organization_name": 1, "reviews_in_progress": 1, 
		"score_sum": 1, "reviews_submitted": 1, "kiva_fit_count":1, "sustainable_model_count": 1,
		"clear_social_impact_count": 1, "num_reviews": 1, "open_to_review": 1},
		function(err, applications) {
		console.log(applications);
		res.send(applications);
	});
};

exports.send_applications_rest= function(req, res) {
	Application.find( {"shortlisted": false}, {"_id": 1, "organization_name": 1, "reviews_in_progress": 1, 
		"score_sum": 1, "reviews_submitted": 1, "kiva_fit_count":1, "sustainable_model_count": 1,
		"clear_social_impact_count": 1, "num_reviews": 1, "open_to_review": 1},
		function(err, applications) {
		console.log(applications);
		res.send(applications);
	});
};

exports.send_volunteers= function(req, res) {
	var approval = req.params.approval;

	Volunteer.find( {approved: approval},
		function(err, volunteers) {
		res.send(volunteers);
	});

};

            
exports.view_one_application = function(req, res) {
	res.render('single_org.ejs', {app_id: req.params.id});
};

exports.load_single_application = function(req, res) {
	Application.findById(req.params.id, function(err, application) {
		if(err) {
			console.log(err);
			res.send(404);
		} else {
			res.send(application);
		}
	});
};


exports.save_application_changes = function(req, res) {
	var org_id = req.body.organization_name;
	console.log(org_id);
	console.log("updating");
	async.parallel(
		[
			function(callback) {
				//save review
				Application.update({
					"_id": ObjectId(req.params.id)},{
						
						organization_name: req.body.organization_name,
						description: req.body.description,
						token: req.body.token,
						organization_address: req.body.organization_address,
						organization_url: req.body.organization_url,
						open_to_review: req.body.open_to_review,
						shortlisted: req.body.shortlisted

					}, function(err) {
						if (err) {return callback(err)};
						console.log(err);
						console.log("Error updating values");
						callback();
					});
			},
			
			
		], function(err) {
			if (err) {res.send(404);};
			console.log("submission complete");
			res.redirect('/admin_applications');
		});
	};

//Page: admin submit new application page
exports.submit_application = function(req, res) {
	res.render("admin_submit.ejs", {error: "lalal"});
};


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
		organization_url: req.body.organization_url,
		volunteer_list: []
	});

	application.save(function(err, application) {
		console.log(application);
		if(err) {console.log(err);}
		else {
			res.redirect('/admin');
		}
	});
};

exports.approve_volunteer = function(req, res) {
	Volunteer.findOneAndUpdate({"_id": new ObjectId(req.body.id)},
		{approved: 1}, function(err, data) {
		if(!err) {
			var email = new sendgrid.Email({
					to: data.email_address,
					from: 'kiva@kiva.com',
					bcc: 'dhwari@gmail.com',
					subject:'Volunteer Approved!',
				});
			email.setHtml('<p>Dear'  + data.first_name + '<br /> Thanks for signing up to be a volunteer! '+ 
			 			'Feel free to visit the app and login to get started. The first two things to do are to' + 
			 			'go through the tutorials and fill out the confidentiality form.' + 
			 			'<br /> Thanks, <br /> Folks at Kiva</p>');
			sendgrid.send(email, function(err, json) {
				if (err) { return res.send(err); }
				console.log(json);
				console.log('done with the request!');
				res.send(200);
			});
		} else {
			console.log("error found: " + err);
			res.send(err);	
		}
		});
};

exports.deny_volunteer = function(req, res) {
	Volunteer.findOneAndUpdate({"_id": new ObjectId(req.body.id)},
		{approved: null}, function(err, data) {
		if(!err) {
			console.log(data);
			// Send a rejection email?
			console.log('done with the deny request!');
			res.send(200);
		} else {
			res.send(err);
		};
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

