The Kiva Crowdsourced Due Diligence App, built by Hack4Impact

#About Us
[Hack4Impact](http://hack4impact.org/) is a student organization 
at the University of Pennsylvania that connects nonprofits with student software 
developers. Through semester-long projects, we build webapps to help 
socially-oriented organizations accomplish their goals even better. Inspired by 
technology's huge potential to empower activists and humanitarians, our mission 
is to foster the wider adoption of software as a tool for social impact.

#About Our Client
Kiva Microfunds (commonly known by its domain name, Kiva.org) is a 501(c)(3) non-profit organization that allows people to lend money via the Internet to low-income / underserved entrepreneurs and students in over 70 countries. Kiva's mission is “to connect people through lending to alleviate poverty.”


#About The Project
Kiva came to us with the goal of building an app that would allow them to more quickly approve loans to entrepreneurs around the world. With the recent addition of Kiva Zip, a new Kiva product that allows non-traditional lending institutions (such as churches and schools), Kiva was receiving thousands of loan applications and needed a process by which to crowd-source application reading.


We began by sitting down with a few Kiva members who gave us a detailed spec of what they were hoping the app accomplish. Beyond just reviewing loan applications, the “Crowd-based Due Diligence App” needed to be a useful tool for Kiva administrators and create an effective user experience for volunteers. Some of the key features included:

+ Gamification to help incentivize volunteers to continue working
+ Document viewer so that each loan application could be viewed as the review was being completed
+ Dashboard for administrators to quickly see aggregated statistics per loan application
+ Question upvote mechanisms for volunteers to determine what other information would be useful in evaluating the loan

At the end of the semester, we handed the project off to the engineering team of Kiva, who will integrate it with their systems and deploy it in the coming year.


##Technologies Used For This Project 
+ [Node](http://nodejs.org) 
+ [Express](http://expressjs.com)
+ [jQuery](http://jquery.com/)
+ [MongoDB](http://www.mongodb.org)

##Languages Used For This Project 
+ JavaScript
+ HTML
+ CSS

#How to get started with this project

1. `cd` to the directory where this project will be stored.

		cd path/to/directory

2. Create a local git repository and set up this repo as your remote repo.
	
		git init
		git remote add origin https://github.com/hack4impact/Kiva.git

3. Pull the project onto your local machine. This will give you copies of all 
files in the project.

		git pull origin master

4. Install [`virtualenv`](http://virtualenv.readthedocs.org/en/latest/virtualenv.html). 

5. Create a virtual environment. This will create a directory called `ENV/` that 
will hold any libraries you install.

		virtualenv ENV

6. Activate your virtual environment.

		source ENV/bin/activate

7. Install the project's requirements.
		
		npm install

8. Install [MongoDB](http://www.mongodb.org/downloads)

8. Run a local Mongo instance.

		mongod

9. Run your local node server

		node app.js

9. Head on over to http://0.0.0.0:5000/!

## License
[MIT License](LICENSE.md)
