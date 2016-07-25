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

/*--------------  Admin Functions ------------------ */


/***** Admin Pages ****/

/*
 *  Temporary: Page to submit organizations
 */
exports.submit_application = function(req, res) {
    res.render("admin_submit.ejs", {error: "lalal", name: req.session.fullname});
};


/*
 * loads admin dashboard page
 */

exports.view_applications = function(req, res) {
    res.render("main.ejs", {error: "lalal", name: req.session.fullname});   
};

/*
 * renders page for single organization
 * @params organization id
 */

exports.view_one_application = function(req, res) {

    Application.findById(req.params.id, function(err, application) {
        if(err) {
            res.send(404);
        } else {
            res.render('single_org.ejs', {app_id: req.params.id, name: req.session.fullname});
        }
    });

};

/*
 * Loads admin signup page
 */

 exports.admin_signup_page = function(req, res) {
    var error = '';
    
    if (req.session.email_duplicate) {
        error = 'This email has already been registered.';
        req.session.email_duplicate = null;
    }

    res.render("admin_signup.ejs", {error: error, name: req.session.fullname});
};

/**** Admin Helper Methods ****/


/*
 * loads the applications that have been shortlisted
 * @return list of application objects
 */

exports.send_applications_short= function(req, res) {
    Application.find( {"shortlisted": true}, {"_id": 1, "organization_name": 1, "reviews_in_progress": 1, 
        "score_sum": 1, "reviews_submitted": 1, "kiva_fit_count":1, "sustainable_model_count": 1,
        "clear_social_impact_count": 1, "num_reviews": 1, "open_to_review": 1},
        function(err, applications) {
            console.log(applications);
            res.send(applications);
        });
};





/*
 * loads the applications that have been not yet been shortlisted
 * @return list of application objects
 */

exports.send_applications_rest= function(req, res) {
    Application.find( {"shortlisted": false}, {"_id": 1, "organization_name": 1, "reviews_in_progress": 1, 
        "score_sum": 1, "reviews_submitted": 1, "kiva_fit_count":1, "sustainable_model_count": 1,
        "clear_social_impact_count": 1, "num_reviews": 1, "open_to_review": 1},
        function(err, applications) {
        console.log(applications);
        res.send(applications);
    });
};

/*
 * loads approved/unapproved volunteers
 * @params approval value (0 or 1)
 * @return list of volunteer objects
 */

exports.send_volunteers= function(req, res) {
    var approval = req.params.approval;
    Volunteer.find( {approved: approval},
        function(err, volunteers) {
        res.send(volunteers);
    });

};



/*
 * loads single organization/application
 * @params organization id
 * @return application object
 */

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

/*
 * When application is shortlisted, update achievements associated with reviews
 * @params organization id
 */

exports.save_application_changes = function(req, res) { 
    Application.findById(req.params.id, function(err, application) {
        if(!application.shortlisted && req.body.shortlisted){
            for (var i = 0; i < application.volunteer_list.length; i++) {
                var achievement = create_achievement(4, application.volunteer_list[i], application.organization_name);
                achievement.save(function(err, achiev) {
                    if (err) {console.log(err)};
                    console.log("achievement saved ");
                }); 
            };
            for (var i = 0; i < application.reviews_submitted.length; i++) {
                Review.findById(application.reviews_submitted[i], function(err, review) {
                    if (review.recommend_rating > 3){
                        var achievement = create_achievement(5, review.reviewer_id, application.organization_name);
                        achievement.save(function(err, achiev) {
                            if (err) {console.log(err)};
                            console.log("achievement saved ");
                            Volunteer.update({"_id": review.reviewer_id}, 
                            {$inc: {num_points: achievement.points}}, function(err) {
                                if (err) {return callback(err)};
                                console.log("points updated");                          
                            })
                        }); 
                    }
                })              
            };
        }
        application.organization_name = req.body.organization_name;
        application.description = req.body.description;
        application.organization_gdocs_url = req.body.organization_gdocs_url;
        application.organization_url = req.body.organization_url;
        application.open_to_review = req.body.open_to_review;
        application.shortlisted = req.body.shortlisted;             
        application.save();
        if(err) {
            console.log(err);
            res.send(404);
        } else {
            console.log("submission complete");
            res.redirect('/admin_applications');
        }
    }); 
};



/*
 * Creates application/organization
 * @params form data
 */

exports.create_application = function(req, res) {
    console.log("does this work");
    var application = new Application({
        organization_name: req.body.organization_name,
        description: req.body.description,
        organization_gdocs_url: req.body.organization_gdocs_url,
        organization_url: req.body.organization_url,
        volunteer_list: []
    });

    application.save(function(err, application) {
        console.log(application);
        if(err) {console.log(err);}
        else {
            res.redirect('/admin_applications');
        }
    });
};

/*
 * Updates volunteer to approved
 * @params volunteer id
 */

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

/*
 * Denies volunteer
 * @params volunteer id
 */

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


/*
 * Allows volunteer to sign up 
 * @params form data
 */

 exports.create_admin = function(req, res) {
    var email = req.body.email_address;
    
    Volunteer.findOne({'email_address': email}, 
        function(err, volunteer) {
            if(volunteer != null) {
                //this is a duplicate entry
                console.log('duplicate');
                req.session.email_duplicate = true;
                res.redirect('/admin/sign-up');
            } else {
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
                req.session.admin = admin.is_admin;
                req.session.logged = true;
                console.log("Volunteer_id to string: " + (admin._id).toString());
                req.session.volunteerId = ObjectId(admin._id.toString());
                req.session.email = admin.email_address;
                res.redirect('/admin_applications');
            }
        });
        }
    });
    //}
};
