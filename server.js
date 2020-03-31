var express = require("express");
var ejs = require("ejs");
var path = require("path");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var session = require("express-session");
var MongoStore = require("connect-mongo")(session);
var cors = require("cors");

var MongoClient = require('mongodb').MongoClient,
f = require('util').format,
fs = require('fs');
app.use(cors());


mongoose.connect(
  '<enter your connection string>' //the string that will be used to connect to database that is hosted globally
);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {});

app.use(
  session({
    secret: "cloud-project",
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: db
    })
  })
);

// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// app.use(express.static(__dirname + '/views'));
app.all('/api/*', function (req, res, next) {
  console.log('Accessing the secret section ...')
  // let session_id = req.get("session_id");
  // UserSession.findOne({ session_id: session_id }, function(err, data) {
  //   if (err) {
  //     console.log("get_user_data_by_session err1: ", err);
  //     res.send({code:403, message: "Not Authorized to access this resource."});
  //   } else {
  //     console.log("Session: ", data);
  //     next() // pass control to the next handler
  //   }
  // });
  next()
  
})

var index = require("./routes/index");
app.use("/", index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("File Not Found");
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

// listen on port 3000
app.listen(3000, function() {
  console.log("Express app listening on port 3000");
});