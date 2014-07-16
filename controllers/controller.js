var Project = require('../models/projects').Project;
var Application = require('../models/application').Application;
var Tag = require('../models/tag').Tag;
var mongoose = require('mongoose');
var async = require("async");
var knox = require('knox');
var fs=require('fs');
var sys=require('sys');
var credentials = require("../config.json");

var client = knox.createClient({
	key: credentials.accessKeyId,
	secret: credentials.secretAccessKey,
	bucket: 'penn-open-source'
});

var ObjectId= mongoose.Types.ObjectId;

//Page: homepage
exports.index = function(req, res) {
	Project.list(function (err, projects) {
		if(err) {
			return res.send(404);
		} else {
			return res.render("main.ejs", {projects: projects});
		}
	})
};

//Page: image upload page
exports.upload_page = function(req, res) {
	res.render("image.ejs", {id: req.params.id});
};



//Page: admin page
exports.admin = function(req, res) {
	Project.list(function (err, projects) {
		if(err) {
			return res.send(404);
		} else {
			return res.render("admin.ejs", {projects: projects});
		}
	})
};

//Page: admin submit new review page
exports.submit_application = function(req, res) {
	res.render("admin_submit.ejs", {error: "lalal"});
}

//Page: submit page
exports.submit = function(req, res) {
	res.render("submit.ejs", {error: "lalal"});
}

//Page: filters images by tag
exports.filter_by_tag = function(req, res) {
	var tag_name = req.params.tag;
	Tag.list(tag_name, function(err, project_names) {
		if(err) {
			return res.send(404);
		} else {
			var arr_projects = []
			for(var i=0; i<project_names.length; i++) {
				if(project_names[i] !== '') {
					arr_projects.push(project_names[i].app_name);
				}
			}
			Project.queryMultipleByName(arr_projects, function(err, projects) {
				if(err) {
					return res.send(404);
				} else { 
					console.log("querying multiple projects already")

					return res.render("main.ejs", {projects: projects});
				}
			});
		}
	});
}

//opens edit page for a single project
exports.edit = function(req, res) {
		Project.queryById(req.params.id, function(err, project) {
			return res.render("edit.ejs", {projects: project[0]});
		});
	}


/*--------------  Helper functions ----------- */


//handles upload function
exports.upload = function(req, res) {
		var id = req.body.id;
		console.log(id);
		fs.readFile(req.files.image.path, function(err, data) {
			console.log(req.files.image.path);
			client.putFile(req.files.image.path, 'images/' + id + ".jpg", {'Content-Type': 'image/jpeg', 'x-amz-acl':'public-read'}, function(err, result) {
				if (err) { 
					console.log('Failed to upload file to Amazon S3'); 
					console.log(err);
				return res.send(404);
			} else { 
				console.log('Uploaded to Amazon S3');
				return res.redirect('/');
			}		
		});
	});
};



//handles update for an edit page
exports.update_project = function(req, res) {

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

//for autocomplete in tags
exports.search_tags = function(req, res) {
	var tag_name = req.params.tag;
	Tag.search(tag_name, function(err, tag_names) {
		if(err) {
			return res.send(404);
		} else {
			return res.send('options.ejs', {elements: tag_names});
		}
	});
};

//finds single project based on id
exports.search_findOne = function(req, res) {
	var id = req.params.id;
	Project.queryById(id, function(err, project){
		return res.send(project);
	});
};


//creates new project
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

