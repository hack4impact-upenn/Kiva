var mongoose = require('mongoose');
var SHA3 = require("crypto-js/sha3");
var async = require("async");
var fs=require('fs');
var sys=require('sys');

var Application = require('../models/application').Application;
var Volunteer = require('../models/volunteer').Volunteer;
var Review = require('../models/review').Review;
var Question = require('../models/question').Question;
var Achievement = require('../models/achievement').Achievement;
var credentials = require("../config.json");
var sendgrid  = require('sendgrid')('hack4impact', 'dhruvmadethis1');
var request = require('request');
var ObjectId= mongoose.Types.ObjectId;

var gDocsUtil = require("google-drive-util");

/*--------------  General Functions ----------- */


/**
 * Opens admin/volunteer homepage based on login credentials
 * Redirects to login page if invalid credentials
 */

exports.index = function(req, res) {
    if(req.session.logged) {
        if (req.session.admin) {
            res.redirect('/admin_applications');
        } else {
            res.redirect('/volunteer/home');
        }
    } else {
        res.render("index.ejs", {message: null, name: null});
    }
};

/**
 * Logs in users
 * Updates acheivement information based on consecutive login days
 * @param req.body has login details
 */

exports.login = function(req, res) {
    var email = req.body.email_address;
    var password = SHA3(req.body.password).toString();
    Volunteer.findOne({'email_address': email, 'password':password},
        function(err, volunteer) {
            if(volunteer != null) {
                    req.session.admin = volunteer.is_admin;
                    req.session.logged = true;
                    req.session.fullname = volunteer.first_name + " " + volunteer.last_name;
                    req.session.volunteerId = ObjectId(volunteer._id.toString());
                    req.session.email = volunteer.email_address;
                    req.session.finished_training = volunteer.finished_training;
                    if(req.session.admin) {
                        res.redirect('/admin_applications');
                    } else {
                        var today = new Date();
                        today.setHours(0,0,0,0);
                        var last_login_day = new Date(Date.parse(volunteer.last_login_date));
                        last_login_day.setHours(0,0,0,0);
                        volunteer.last_login_date = Date.now();
                        if(Date.parse(today) - Date.parse(last_login_day) === 86400000) {
                            volunteer.consecutive_login_days++;
                            var achievement = create_achievement (2, req.session.volunteerId, volunteer.consecutive_login_days);
                            achievement.save(function(err, achiev) {
                                if (err) {console.log(err)};
                                volunteer.num_points += achievement.points;
                                volunteer.save(function(err, vol) {
                                });
                            });
                        } else {
                            if(Date.parse(today) - Date.parse(last_login_day) > 86400000){
                                volunteer.consecutive_login_days = 1;
                                var achievement = create_achievement (3, req.session.volunteerId, -1);
                                achievement.save(function(err, achiev) {
                                    if (err) {console.log(err)};
                                    console.log("achievement saved ");
                                });
                            }
                            volunteer.save(function(err, vol) {
                                    console.log("Updated login day and consec");
                                });
                        }
                        res.redirect('/volunteer/home');
                    }
                } else if (volunteer === null) {
                    res.render("index.ejs", {message:"Your login is incorrect.", name: null});
            } else {
                if(err) {
                } else {
                    console.log('something went horribly wrong');
                }
                res.send(404);
            }
        });
};

/**
 * Logs out users
 * redirects to login screen
 */
exports.logout = function(req, res) {
    req.session.logged = null;
    req.session.admin = null;
    req.session.username = null;
    req.session.volunteerId = null;
    req.session.email_duplicate = null;
    req.session.email = null;
    req.session.fullname = null;
    req.session.finished_training = null;
    return res.redirect("/");
};

/**
 * Loads single application information
 * @param organization id
 * @return Application object
 */
 exports.load_application = function(req, res) {
    var org_id = req.params.org_id;
    Application.findOne({"_id": ObjectId(org_id)}, function(err, application){
        res.send(application);
    });
};

/*--------------  Volunteer Functions ----------------- */


/* pulls data */

/* loads volunter model data for sesssion
 * @param volunteer id (taken from session)
 * @return Volunteer object
 */

exports.loadVolunteer = function(req, res) {
    console.log("ajax call is working");
    Volunteer.findOne({"_id": req.session.volunteerId}, function(err, volunteer) {
        res.send(volunteer);
    });
};

/* loads next review for volunteer to complete
 * @param volunteer id (taken from session)
 * @return application object
*/
exports.getMinReviewedApplication = function(req, res) {
        console.log(req.session.volunteerId);
        Application.get_min_reviewed_application(ObjectId(req.session.volunteerId), function (err, application) {
            if(application === null) {
                res.send({"data" : "none"});
            } else {
                res.send(application);
            }
        });
};

/**
 * Gets completed applications for the logged in volunteer
 * @param volunteer id (taken from session)
 * @return list of review objects that the volunteer completed
 */

exports.getCompletedApplications = function(req, res) {
    Review.find({"reviewer_id": req.session.volunteerId, "submitted": true}, function(err, reviews) {
        if(err) {console.log(err);}
            res.send(reviews);
    });
};


/*
 * Gets achievements for the logged in volunteer
 * @param volunteer id (taken from session)
 * @return list of acheivement objects that the volunteer has earned
 */
exports.getAchievements = function(req, res) {
    Achievement.find({"reviewer_id": req.session.volunteerId}, function(err, achievements) {
        if(err) {console.log(err);}
            res.send(achievements);
    });
};


/*
 * Creates volunteer object (for signup)
 * @param request form that includes first_name, last_name, email_address, and password
 */

exports.createVolunteer = function(req, res) {
    var email = req.body.email_address;
    var usern = req.body.username;

    Volunteer.findOne( {$or: [{'email_address': email}, {'username': usern}]},
        function(err, volunteer) {
            if(volunteer != null) {
                //this is a duplicate entry
                req.session.email_duplicate = true;
                console.log("DUPLICATE!!");
                res.redirect('/volunteer/sign-up');
            } else {
                var volunteer = new Volunteer({
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email_address: req.body.email_address,
                    username: req.body.username,
                    password: SHA3(req.body.password).toString(),
                    //TODO: Add confirm password?
                    finished_training: false,
                    approved: false,
                    linked_in: req.body.linked_in,
                    why_kiva:  req.body.why_kiva,
                    what_skills: req.body.what_skills
                });
                volunteer.save(function(err, volunteer) {
                    if(err) {console.log(err);}
                    else {
                        req.session.admin = volunteer.is_admin;
                        req.session.logged = true;
                        console.log("Volunteer_id to string: " + (volunteer._id).toString());
                        req.session.volunteerId = ObjectId(volunteer._id.toString());
                        req.session.email = volunteer.email_address;
                        req.session.fullname = volunteer.first_name + " " + volunteer.last_name;
                        req.session.finished_training = volunteer.finished_training;
                        res.redirect('/volunteer/training');
                    }
                });
            }
        });
};

/*
 * Checks whether the username and email are already taken
 * and responds appropriately.
 * @param user email and username
 */
exports.check_email_username = function(req, res) {
    var email = req.body.email;
    var username = req.body.username;
    Volunteer.findOne({'email_address': email}, function(err, volunteer_email) {
        var email_exists = (volunteer_email != null);
        Volunteer.findOne({'username': username}, function(err, volunteer_username) {
            var username_exists = (volunteer_username != null);
            if (email_exists && username_exists) {
                res.send("both");
            } else if (email_exists) {
                res.send("email");
            } else if (username_exists) {
                res.send("username");
            } else {
                res.send("neither");
            }
        });
    });
}

/*
 * Updates volunteer object field 'finished_training' to true
 * @param volunteer id (taken from session)
 */
exports.volunteerFinishedTraining = function(req, res) {
    console.log(req.body.ans1 + " " + req.body.ans2 + " ");
    if (req.body.ans1 != 'crowdfunded' || req.body.ans2 != '50') {
        var incorrect = 'Sorry, at least one of your answers is incorrect. Make sure to review all the materials first.';
        res.render('training.ejs', {name: req.session.fullname, finished_training: req.session.finished_training, message: incorrect});
    } else {
        Volunteer.findOne({"_id": req.session.volunteerId}, function(err, volunteer) {
            volunteer.finished_training = true;
            req.session.finished_training = true;
            volunteer.save(function(err, volunteer) {
                if(err) {
                    console.log(err);
                } else {
                    res.redirect('/volunteer/home');
                }
            });
        });
    }
};


/* Volunteer Pages */


/*
 * Loads page for volunteer signup
 */
exports.volunteerSignupPage = function(req, res) {
    var error = null;
    if (req.session.email_duplicate) {
        error = 'This email or username has already been registered.';
        req.session.email_duplicate = null;
    }
    res.render("volunteer_signup.ejs", {error: error, name: req.session.fullname});
};

/*
 * Loads page for volunteer homepage
 */
exports.volunteerHome = function(req, res) {
    if(req.session.logged) {
        res.render('homepage.ejs', {name: req.session.fullname});
    } else {
        res.redirect('/');
    }
};

/*
 * Loads page for volunteer training modules
 */
exports.volunteerTraining = function(req, res) {
    if(req.session.logged) {
        res.render('training.ejs', {name: req.session.fullname, finished_training: req.session.finished_training, message: null});
    } else {
        res.redirect('/');
    }
};

/*
 * Loads page for once volunteer finishes review
 */
exports.completed_review_page = function(req, res) {
    org_id = req.params.org_id;
    res.render("reviewed_application.ejs", {org_id: org_id, name: req.session.fullname});
};

/*
 * Loads page for editing a review
 * @param review_id
 */
exports.edit_review = function(req, res) {
    res.render('review.ejs', {review_id: req.params.id, name: req.session.fullname});
};

/********Volunteer Helper Functions********/

/*
 * Loads documents for reviewer to edit
 * TODO: Update based on Kiva's system
 * @return Set of links that can be loaded via GoogleDoc iFrame
 */

 function getParameterByName(name, str) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(str);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/* The goal of this function is to pass the links to the organization's documents
 * to the webpage so they can be rendered in the iframe. Currently, there are a
 * couple of fake blank documents on a temporary myjson.com site (see func below).
 * I imagine when you actually implement this you will be pulling the links to the documents
 * from a database so the request would be unecessary. Please see the 'load_links'
 * function in review.ejs to see how the dropbox menu is created and the 'dropdown'
 * function below it to see how the iframe src is manipulated.
 */

exports.load_organization_docs = function(req, response) {
  Application.findById(req.params.org_id, function(err, application) {
      var folderId = getParameterByName('id', application.organization_gdocs_url);

      if (folderId && folderId.length > 0){
        var gAuth = gDocsUtil.readTokenSync();
        var chunk_num = 0;

        gDocsUtil.getFileInfo(
          gAuth,
          folderId,
          "",
          handleGDocReturn);

          function handleGDocReturn(path, res, chunk_max){
            if (chunk_max === undefined || chunk_num < chunk_max){
              response.write(JSON.stringify({name: res.title, link: res.alternateLink}));
            } else if (chunk_num === chunk_max) {
              response.write(JSON.stringify({name: res.title, link: res.alternateLink}));
              response.end();
            }
            chunk_num++;

            if (gDocsUtil.isFolder(res)) {
              gDocsUtil.getFolderInfo(gAuth, res.id, path+res.title+"/", handleGDocReturn);
            }
          };
      }
  });
}

/*
 * Loads application data associated with the organization
 * @params Application Id
 * @return Json version of application model
 */

exports.load_organization_data = function(req, res) {
    console.log("loading organization data");
    Application.findById(req.params.org_id, function(err, application) {
        return res.json(application);
    });
}

/*
 * Loads questions associated with Application/Organization
 * @params organization_id
 * @return list of Question Objects
 */

exports.get_questions = function(req, res) {
    var org_id = req.params.org_id;
    Question.find({"organization_id": org_id}, function(err, questions) {
        return res.json(questions)
    });
}

/*
 * Loads questions associated with Application/Organization
 * @params organization_id
 * @return list of Question Objects
 */
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

/*
 * Creates a review object (represents review that volunteer has started)
 * @params organization id
 * @params volunteer id (taken from session)
 * @return list of Question Objects
 */

 exports.create_review = function(req, res) {
    org_id = req.params.id;
    var review = new Review({
        reviewer_id: req.session.volunteerId,
        organization_id: org_id,
    });
    review.save(function(err, review) {
        Application.add_review_in_progress(org_id, review._id, function(err) {
            if(err) {
                console.log(err);
            } else {
                Volunteer.add_review_in_progress(req.session.volunteerId, review._id, function(err) {
                    if(err) {
                        console.log(err);
                        res.send(404);
                    } else {
                        res.redirect('/review/edit/' + review._id);
                    }
                });
            }
        });
    });
};

/*
 * loads a review object (for a review that the volunteer has started)
 * @params review object id
 * @return Review Object
 */

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

/*
 * Saves review (not submit)
 * @params review object id
 * @params review form data
 */

exports.save_review = function(req, res) {
    Review.update({"_id": ObjectId(req.params.id)},
            {
                clear_business_model: req.body.clear_business_model,
                clear_social_impact: req.body.clear_social_impact,
                loan_well_structured: req.body.loan_well_structured,
                well_positioned_to_repay: req.body.well_positioned_to_repay,
                well_positioned_to_communicate: req.body.well_positioned_to_communicate,
                recommend_rating: req.body.recommend_rating,
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

/*
 * Creates achievement object based on type
 * @params achievement id
 * @params volunteer id
 * @params extra_info to store in the achievement m
 */

create_achievement = function(achievement_id, volunteer_id, extra_info) {
    var numPoints = 0;
    var string = "";
    var dateNow = new Date();
    switch(achievement_id) {
        case(1):
            numPoints = 10;
            string = "You just submitted a review!";
            break;
        case(2):
            var days_in_a_row = extra_info;
            numPoints = days_in_a_row;
            string = "You have logged in " + days_in_a_row + " days in a row!";
            break;
        case(3):
            numPoints = 0;
            string = "Welcome back! Come back every day to earn bonus points";
            break;
        case(4):
            numPoints = 0;
            var org_name = extra_info;
            string = "The application you reviewed: \'"+ org_name + "\' has been shortlisted!";
            break;
        case(5):
            numPoints = 15;
            var org_name = extra_info;
            string = "You gave a good rating to shortlisted application: \'"+ org_name + ".\' Nice job!";
            break;
        default:
            string = "achievement error";
            break;
    }

    var achievement = new Achievement({
        reviewer_id: volunteer_id,
        achievement_text: string,
        points: numPoints,
        date: dateNow,
        read: false,
    });
    return achievement;
}

/*
 * Gets achievements for a single volunteer
 * @params volunteer id (taken from session)
 * @return list of acheivements
 */

exports.get_achievements = function(req, res) {
    Achievement.find({"reviewer_id": req.session.volunteerId})
        .sort({date: -1})
        .exec( function(err, achievements) {
        if(err) {console.log(err)}
            res.send(achievements);
        });
}

/*
 * Handles the submission for a review
 * @params organization/application id
 * @params review id
 */
exports.submit_review = function(req, res) {
    //TODO: Add the review to the user's submitted list
    //TODO: This is massive. refactoring needed?
    var org_id = req.body.organization_id;
    Review.findById(req.params.id, function(err, review) {
        if (review.submitted) {
            res.redirect('/volunteer/home');
        } else {
            async.parallel(
                [
                    function(callback) {
                        //save review
                        Review.update({
                            "_id": ObjectId(req.params.id)},{
                                submitted: true,
                                date_review_submitted: Date.now(),
                                clear_business_model: req.body.clear_business_model,
                                clear_social_impact: req.body.clear_social_impact,
                                loan_well_structured: req.body.loan_well_structured,
                                well_positioned_to_repay: req.body.well_positioned_to_repay,
                                well_positioned_to_communicate: req.body.well_positioned_to_communicate,
                                recommend_rating: req.body.recommend_rating,
                            }, function(err) {
                                if (err) {return callback(err)};
                                callback();
                            });
                    },

                    //in Application: add to submitted list
                    function(callback) {
                        Application.submit_review(org_id, req.params.id, function(err) {
                                if (err) { console.log("error in application_submit review");
                                    return callback(err)};
                                callback();
                            });
                    },
                    function(callback){
                        Volunteer.add_completed_review(req.session.volunteerId, req.params.id, function(err) {
                                if (err) {return callback(err)};
                            console.log("added completed review");
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
                        //update average score/counts
                        console.log(req.body.clear_business_model);
                        var clear_business_model = (req.body.clear_business_model === 'true' ? 1 : 0);
                        var clear_social_impact = (req.body.clear_social_impact === 'true' ? 1 : 0);
                        var loan_well_structured = (req.body.loan_well_structured === 'true' ? 1 : 0);
                        var well_positioned_to_repay = (req.body.well_positioned_to_repay === 'true' ? 1 : 0);
                        var well_positioned_to_communicate = (req.body.well_positioned_to_communicate === 'true' ? 1 : 0);

                        Application.update({"_id": org_id},
                            {$inc: {score_sum: req.body.recommend_rating,
                                    clear_business_model_count: clear_business_model,
                                    loan_well_structured_count: loan_well_structured,
                                    well_positioned_to_repay_count: well_positioned_to_repay,
                                    well_positioned_to_communicate_count: well_positioned_to_communicate,
                                    clear_social_impact_count: clear_social_impact}
                                }, function(err) {
                            if (err) {return callback(err)};
                            console.log("score updated");
                            callback(err);
                        })
                    },
                    function(callback) {
                        var achievement = create_achievement (1, req.session.volunteerId, 0);
                        achievement.save(function(err, achiev) {
                                if (err) {return callback(err)};
                                console.log("achievement saved");
                                Volunteer.update({"_id": req.session.volunteerId},
                                    {$inc: {num_points: achievement.points}
                                        }, function(err) {
                                    if (err) {return callback(err)};
                                    console.log("points updated");
                                })
                                callback(err);
                            });
                    },
                ], function(err) {
                    if (err) {res.send(404);};
                    console.log("submission complete");
                    res.redirect('/review/completed/' + org_id);
                });
            }
        });
    };

/*
 * loads all reviews completed for an organization
 * @params organization/application id
 * @return list of reviews
 */
exports.load_completed_reviews = function(req, res) {
    var org_id = req.params.org_id;
    Review.find({"organization_id": org_id, "submitted": true}, function(err, reviews) {
        if(err) {console.log(err)}
            res.send(reviews);
    });
};

/*
 * loads volunteers with most points
 * @return list of volunteer objects
 */

exports.load_leaderboard = function(req, res) {
    Volunteer
    .find({})
    .sort({num_points: -1})
    .limit(10)
    .exec(function(err, posts) {
        if(err) {console.log(err)}
        res.send(posts);
    });
};
