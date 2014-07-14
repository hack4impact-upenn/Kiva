var express = require('express');
var app = require('./app.js');
var Project = require('./models/projects').Project;
var Tech = require('./models/projects').Tech;
var Tag = require('./models/projects').Tag;



module.exports = function (app) {
//controllers
	app.get("/", projects.index);
	//app.get("/submit", routes.submit);
	app.post("/post", projects.create);
}

// var submit_page = function(req, res) {
// 	var body = "Hello Word";
// 	res.render("submit.ejs", {error: "lalal"});
// }

// var get_main = function(req, res) {
// 	//list projects
// 	Project.find({}, function(err, projects) {
// 		if(err) {
// 			res.send(404);
// 		} else {
// 			res.render("main.ejs", {projects: projects});
// 			}
// 		})
// 	}

// var post_app = function(req, res) {
	
// //if (app_name === "" || description === "" || demo_link === ""
// //			|| location === "" || technologies === "" || builders === "" || date === "" 
// //			|| date === "" || contact === "" || github_permis === "") {
// //		res.render("submit.ejs", {error : 1});
// //	} else {
// 		Project.create({
// 			 app_name : req.body.app_name,
// 			 description : req.body.description,
// 			 demo_link : req.body.demo,
// 			 location : req.body.location,
// 			 technologies : req.body.technologies,
// 			 builders : req.body.builders,
// 			 date : req.body.date,
// 			 contact : req.body.contact,
// 			 github_permis : req.body.github_permis,
// 			 github : req.body.github,
// 			 personal : req.body.personal,
// 			 approved : req.body.approved
// 		}, function(err, proj){
// 			if(tag)


// 		})
// 	//}
// }

// var routes = { 
//   submit: submit_page,
//   post: post_app,
//   main: get_main,
// };