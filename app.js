//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hi! I am Kaizad Beddingwala, a web designer/developer focused on crafting great web experiences. Designing and Coding have been my passion since the days I started my career in engineering but I found myself into web design/development since 2021. I enjoy creating beautifully designed, intuitive and functional websites.For over past 6 months, I have worked hard on my skills and I am trying hard to learn new skills so that I can stand on my own or benefit to the company which I would be working for. Thank you";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/blogDb', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  name: String,
  username: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required:true
  },
  content: {
    type:String,
    required:true
  }
});
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({name: profile.displayName,
      username: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
const Post = mongoose.model("Post", postSchema);
//lodash
var _ = require('lodash');

// let posts= [];

app.get("/blog", function(req, res) {
  Post.find({},function(err, posts){
    res.render("home", {
      homeContent: homeStartingContent,
      posts: posts
    });
  });

});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] }));

app.get("/", function(req, res) {
  res.render("newhome");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/about", function(req, res) {
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res) {
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function(req, res) {
  res.render("compose");
});

app.get("/posts/:postId", function(req, res){
  // const requestedTitle = _.lowerCase(req.params.postName);
  const requestedPostId = req.params.postId;
  Post.findOne({_id:requestedPostId}, function(err,post){
    res.render("post",{head: post.title, body: post.content, id:requestedPostId});
  })
  // posts.forEach(function(post){
  //   const head1 = post.title;
  //   const head = _.lowerCase(post.title);
  //   if (head === requestedTitle) {
  //     res.render("post",{head: head1, body: post.content});
  //   };
  // });
});

app.post("/compose", function(req, res) {
  const post = new Post ({
    title:req.body.postTitle,
    content:req.body.postBody
  });
  // posts.push(post);
  // post.save(() => res.redirect("/"));
  post.save(function(err){
    if (!err){
      res.redirect("/");
    } else {
      res.redirect("/compose");
    }
  });
});



app.post("/delete", function(req, res){
  //console.log(req.body.button);
  Post.deleteOne({_id:req.body.button},function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/");
      console.log("Succesfully deleted");
    }
  });
});

app.post("/search", function(req, res){
  const requestedTitle = _.lowerCase(req.body.search);
  Post.find(function(err,posts){
    if(err){
      console.log(err);
    }else {
     posts.forEach(function(post){
       if(_.lowerCase(post.title) == requestedTitle){
         res.render("post",{head: post.title, body: post.content, id:post._id});
       }
     })
  }
  })
});

app.get("/title",function(req,res){
  Post.find(function(err,posts){
    res.render("title",{titles:posts});
  });
});

app.get("/secrets",function(req,res){
  if (req.isAuthenticated()) {
    res.redirect("/blog");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local") (req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {

  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user, function(err) {
  if (err) {
  console.log(console.error)
   } else {
     passport.authenticate("local") (req, res, function() {
       res.redirect("/secrets");
     });
 }
});

});

app.get("/logout", function(req,res) {
  req.logout();
  res.redirect("/");
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
