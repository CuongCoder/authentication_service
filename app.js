const express = require("express");
const app = express();

const logger = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const uuid = require("uuid");
const session = require("express-session");
const validation = require("express-validator");

require("dotenv").config();

// logger only in development
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(validation());

// declare path static that used
app.use(express.static("static"));
app.use(express.json());

// hide x-power-by section in response-header
app.disable("x-powered-by");

// middleware to resolve CORS, set header for api
app.use(function(req, res, next) {
  var oneof = false;
  if (req.headers.origin) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    oneof = true;
  }
  if (req.headers["access-control-request-method"]) {
    res.header(
      "Access-Control-Allow-Methods",
      req.headers["access-control-request-method"]
    );
    oneof = true;
  }
  if (req.headers["access-control-request-headers"]) {
    res.header(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"]
    );
    oneof = true;
  }
  if (oneof) {
    res.header("Access-Control-Max-Age", 60 * 60 * 24 * 365);
  }

  // intercept OPTIONS method
  if (oneof && req.method === "OPTIONS") {
    res.send(200);
  } else {
    next();
  }
});

// config middleware assign session id
app.use(
  session({
    key: "user_sid",
    secret: "goN6DJJC6E287cC77kkdYuNuAyWnz7Q3iZj8",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000
    }
  })
);

// middleware check token except route sign up, sign in
// const verifyToken = require('./server/middleware/verifyToken.middleware')
// app.use(verifyToken)

// connect db
// var pathDatabase = 'mongodb://127.0.0.1/authentication'
const pathDatabase =
  "mongodb+srv://CuongCoder:Manhcuong1998@cluster0-ieqyd.mongodb.net/authentication?retryWrites=true";
mongoose.connect(pathDatabase, {
  useNewUrlParser: true,
  useCreateIndex: true
});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("connect successfully!");
});

let BASE_URL = "";
if (process.env.NODE_ENV === "production") {
  BASE_URL = process.env.PROD_URL_API;
} else {
  BASE_URL = process.env.DEV_URL_API;
}

app.get("/", (req, res, next) => {
  // console.log(req.body);
  console.log(req.query);
  res.status(200).send("Successfully");
});

app.get("/test", (req, res, next) => {
  console.log(req.body);
  res.status(200).json({ data: "Successfully" });
});

const isLoggedIn = require("./server/middleware/isLoggedIn.middleware");
var passport = require("passport");
var flash = require("connect-flash");
require("./server/controller/auth.controller")(passport);
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());
// =====================================
// PROFILE SECTION =========================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
app.get("/profile", isLoggedIn, function(req, res) {
  res.send(req.user);
});

// declare router
const bookRoute = require("./server/routes/book.route.js");
const userRoute = require("./server/routes/user.route.js");
app.use("/book", bookRoute);
app.use("/log", userRoute);

app.get("/auth/facebook", passport.authenticate("facebook"));

// handle the callback after facebook has authenticated the user
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/profile",
    failureRedirect: "/"
  })
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: "https://www.googleapis.com/auth/plus.profile.emails.read"
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/profile",
    failureRedirect: "/"
  })
);

app.post(
  "/auth/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureFlash: true
  })
);
module.exports = app;
