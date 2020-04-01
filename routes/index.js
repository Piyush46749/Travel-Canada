var express = require("express");
var router = express.Router();
var User = require("../models/user");
var TwoFactorAuth = require("../models/twofactor");
var UserSession = require("../models/usersession");
var SearchHit = require("../models/search");
var Places = require("../models/places");
var Provinces = require("../models/provinces");
var Booking_History = require("../models/booking_history")
var nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const uuidv1 = require("uuid/v1");
const PDFDocument = require("pdfkit");
const fs = require ("fs")

router.post("/register", function(req, res, next) {
  console.log(req.body);
  var userInfo = req.body;

  if (
    !userInfo.email ||
    !userInfo.username ||
    !userInfo.password ||
    !userInfo.dob ||
    !userInfo.gender
  ) {
    res.send({ code: "400", message: "Bad Request" });
  } else {
    User.findOne({ email: userInfo.email }, function(err, data) {
      if (!data) {
        var c;
        User.findOne({}, function(err, data) {
          if (data) {
            console.log("if");
            c = data.unique_id + 1;
          } else {
            c = 1;
          }

          var newUser = new User({
            unique_id: c,
            email: userInfo.email,
            username: userInfo.username,
            password: userInfo.password,
            gender: userInfo.gender,
            dob: userInfo.dob
          });

          newUser.save(function(err, Person) {
            if (err) console.log(err);
            else console.log("Success");
          });
        })
          .sort({ _id: -1 })
          .limit(1);
        res.send({ code: "200", message: "User registered successfully." });
      } else {
        res.send({
          code: "201",
          message: "User already registered with this email"
        });
      }
    });
  }
});

router.post("/verify-otp", function(req, res, next) {
  var req_data = req.body;
  TwoFactorAuth.findOne({ email: req_data.email }, function(err, data) {
    if (data) {
      if (data.otp == req_data.otp) {
        console.log("OTP Matched");
        TwoFactorAuth.deleteOne({ email: data.email }, function(err, data) {
          if (err) console.log(err);
          else console.log("OTP removed for user: " + data.email);
        });
        var session_id = uuidv1();
        console.log(session_id);
        var userSession = new UserSession({
          email: req_data.email,
          session_id: session_id
        });
        UserSession.findOne({ email: req_data.email }, function(err, data) {
          if (data) {
            UserSession.deleteOne({ email: req_data.email }, function(
              err,
              data
            ) {
              if (err) console.log(err);
              else console.log("OTP removed for user: " + data.email);
            });
          }
          userSession.save(function(err, Person) {
            if (err) console.log(err);
            else console.log("Session Created: " + req_data.email);
          });
        });

        res.send({
          code: "200",
          message: "OTP verified successfully.",
          session_id: session_id
        });
      } else {
        res.send({
          code: "204",
          message: "Incorrect OTP."
        });
      }
    } else {
      res.send({
        code: "205",
        message: "No entry for OTP in records."
      });
    }
  });
});

router.post("/send-otp", function(req, res, next) {
  console.log(req);
  var data = req.body;
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "dalcourselist@gmail.com",
      pass: "Dal@12345"
    }
  });

  var mailOptions = {
    from: "noreply@travel.com",
    to: data.email,
    subject: "travel app alert : One Time Password",
    text: "Your One Time Password to access the Travel App is : " + data.otp
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
      TwoFactorAuth.findOne({ email: data.email }, function(err, data) {
        if (data) {
          TwoFactorAuth.deleteOne({ email: data.email }, function(err, data) {
            if (err) console.log(err);
            else console.log("OTP removed for user: " + data.email);
          });
        }
      });
      var twoFactAuth = new TwoFactorAuth({
        email: data.email,
        otp: data.otp
      });
      twoFactAuth.save(function(err, Person) {
        if (err) console.log(err);
        else console.log("OTP saved for user:" + data.email);
      });
      j;
      res.send({
        code: "200",
        message: "OTP has been successfully sent to the registered email."
      });
    }
  });
});

router.post("/login", function(req, res, next) {
  User.findOne({ email: req.body.email }, function(err, data) {
    if (data) {
      if (data.password == req.body.password) {
        var req_object = {
          email: req.body.email,
          otp: Math.floor(100000 + Math.random() * 900000)
        };
        url = "http://" + "localhost" + ":3000/send-otp";
        var headers = {
          "Content-Type": "application/json"
        };
        fetch(url, {
          mode: "cors",
          method: "POST",
          headers: headers,
          body: JSON.stringify(req_object)
        })
          .then(res => {
            console.log(res.json());
          })
          .then(json => {});
        res.send({
          code: "200",
          message: "OTP has been successfully sent to the registered email."
        });
      } else {
        res.send({ code: "202", message: "Invalid Credentials." });
      }
    } else {
      res.send({ code: "203", message: "User not found" });
    }
  });
});

router.post("/search", function(req, res, next) {
  var search_text = req.body.search_text;
  var s_id = req.body.session_id;
  var resp_data = [];

  Places.find({ $text: { $search: search_text } }, function(err, data) {
    console.log(data);
    resp_data = data;
    console.log("after query");
    UserSession.findOne({ session_id: s_id }, function(err, data) {
      if (data) {
        var newSearchHit = new SearchHit({
          email: data.email,
          search_text: search_text
        });
        newSearchHit.save(function(err, Person) {
          if (err) console.log(err);
          else console.log("Search hit saved");
        });
      }
    });
    res.send({
      code: 200,
      message: resp_data.length + " Result(s) Found",
      data: resp_data
    });
  });
});

router.post("/logout", function(req, res, next) {
  var s_id = req.body.session_id;
  UserSession.findOne({ session_id: s_id }, function(err, data) {
    if (data) {
      UserSession.deleteOne({ email: data.email }, function(err, del_data) {
        if (err) console.log(err);
        else console.log("Session destroyed: " + data.email);
      });
      res.send({
        code: 200,
        message: "Session destroyed. Logout Successful."
      });
    } else {
      res.send({
        code: 200,
        message: "No active session for user."
      });
    }
  });
});

router.post("/user-search-history", function(req, res, next) {
  var s_id = req.body.session_id;
  UserSession.findOne({ session_id: s_id }, function(err, data) {
    var resp_data = [];
    if (data) {
      SearchHit.find({ email: data.email }, function(err, s_data) {
        resp_data = s_data;
        res.send({
          code: 200,
          message: resp_data.length + " Result(s) Found",
          data: resp_data
        });
      });
    } else {
      res.send({
        code: 200,
        message: "No active session for user.",
        data: resp_data
      });
    }
  });
});

function generate_mode_number() {
  const upperCaseAlp = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z"
  ];
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let number =
    upperCaseAlp[Math.floor(Math.random() * (upperCaseAlp.length - 0) + 0)] +
    "" +
    upperCaseAlp[Math.floor(Math.random() * (upperCaseAlp.length - 0) + 0)] +
    "" +
    upperCaseAlp[Math.floor(Math.random() * (upperCaseAlp.length - 0) + 0)] +
    "-" +
    numbers[Math.floor(Math.random() * (numbers.length - 0) + 0)] +
    "" +
    numbers[Math.floor(Math.random() * (numbers.length - 0) + 0)] +
    "" +
    numbers[Math.floor(Math.random() * (numbers.length - 0) + 0)];
  return number;
}

function get_company(mode) {
  let flight_companies = [
    "Jet Airways",
    "Air Canada",
    "United Airles",
    "Air India"
  ];
  let bus_companies = [
    "Greyhound Canada",
    "Autobus Maheux Service",
    "Coach Canada",
    "DRL Coachlines Service"
  ];
  if (mode == "bus") {
    return bus_companies[
      Math.floor(Math.random() * (bus_companies.length - 0) + 0)
    ];
  } else {
    return flight_companies[
      Math.floor(Math.random() * (flight_companies.length - 0) + 0)
    ];
  }
}

router.post("/modes", function(req, res, next) {
  var source = req.body.src;
  var destination = req.body.dest;
  if (!source || !destination) {
    res.send({
      code: "400",
      data: [],
      message: "Bad Request"
    });
  } else {
    t = 355;

    let bus_options = Math.floor(Math.random() * (4 - 1) + 1);
    let modes_data = [];
    if (source == destination) {
      for (var i = 1; i <= bus_options; i++) {
        // Bus fare ranging from 50$ to 100$
        let bus_fare = Math.floor(Math.random() * (100 - 50) + 50);
        modes_data.push({
          mode_number: generate_mode_number(),
          mode: "bus",
          mode_company: get_company("bus"),
          currency: "$",
          mode_fare: bus_fare + ".00",
          mode_id: "bus_" + i
        });
      }
      res.send({
        code: "200",
        message: "Travel options",
        data: modes_data
      });
    } else if (source != destination) {
      let flight_options = Math.floor(Math.random() * (4 - 1) + 1);
      for (var i = 1; i <= bus_options; i++) {
        // Bus fare ranging from 50$ to 100$
        let bus_fare = Math.floor(Math.random() * (100 - 50) + 50);
        modes_data.push({
          mode_number: generate_mode_number(),
          mode: "bus",
          mode_company: get_company("bus"),
          currency: "$",
          mode_fare: bus_fare + ".00",
          mode_id: "bus_" + i
        });
      }
      for (var i = 1; i <= flight_options; i++) {
        let bus_fare = Math.floor(Math.random() * (100 - 50) + 50);
        bus_fare = Math.floor(bus_fare * 2.5);
        modes_data.push({
          mode_number: generate_mode_number(),
          mode: "flight",
          mode_company: get_company("flight"),
          currency: "$",
          mode_fare: bus_fare + ".00",
          mode_id: "flight_" + i
        });
      }
      res.send({
        code: "200",
        message: "Travel options",
        data: modes_data
      });
    } else {
      res.send({
        code: "400",
        data: [],
        message: "Bad Request; Issue with source or destination"
      });
    }
  }
});

router.post("/get-all-provinces", function(req, res, next) {
  Provinces.find({}, { _id: 0 }, function(err, data) {
    if (data) {
      res.send({
        code: 200,
        data: data,
        message: "All the provinces in Canada"
      });
    } else if (err) {
      console.log("Error while fetching the data: " + err);
    }
  });
});

router.post("/get-user-info-by-session", function(req, res, next) {
  UserSession.findOne({ session_id: req.body.session_id }, function(err, data) {
    if (err) {
      console.log("get_user_data_by_session err1: ", err);
      return null;
    } else {
      console.log("Session: ", data);
      User.findOne({ email: data.email }, function(err, user_data) {
        if (err) {
          console.log("get_user_data_by_mail err1: ", err);
          return null;
        } else {
          let user_info = JSON.parse(JSON.stringify(user_data));
          delete user_info["password"];
          console.log("User data in session:", user_info);
          res.send({
            code: 200,
            data: user_info,
            message: "User data from session fetched successfully!"
          });
        }
      });
    }
  });
});

router.post("/get-province-by-id", function(req, res, next) {
  Provinces.findOne({ p_id: id }, function(err, data) {
    if (err) {
      return null;
    } else {
      console.log(data);
      res.send({
        code: 200,
        data: data,
        message: "Province data fetched successfully!"
      });
    }
  });
});

router.post("/get-place-by-id", function(req, res, next) {
  Places.findOne({ place_id: id }, function(err, data) {
    if (err) {
      console.log("err: ", err);
      return null;
    } else {
      console.log(data);
      res.send({
        code: 200,
        data: data,
        message: "Place data fetched successfully!"
      });
    }
  });
});

router.post("/get-user-data-by-email", function(req, res, next) {
  User.findOne({ email: mail_id }, function(err, data) {
    if (err) {
      console.log("get_user_data_by_mail err1: ", err);
      return null;
    } else {
      console.log("User data:", data);
      res.send({
        code: 200,
        data: data,
        message: "User data by email fetched successfully!"
      });
    }
  });
});

router.post("/book-ticket", function(req, res, next) {
  let booking_info = new Booking_History({
    username: req.body.username,
    src: req.body.src,
    dest: req.body.dest,
    mode: req.body.mode,
    mode_company: req.body.mode_company,
    mode_fare: req.body.mode_fare,
    mode_number: req.body.mode_number,
    mode_id: req.body.mode_id,
    date_of_travel: ""+req.body.date_of_travel
  });
  booking_info.save(function(err, data) {
    if (err) throw err;
    else {
      console.log(data);
      res.send({
        code: 200,
        booking_id: data["_id"],
        message: "Booking done for request"
      });
    }
  });
});

router.post("/get-booking-by-id", function(req, res, next) {
  var ObjectId = require("mongodb").ObjectId;
  let booking_id = new ObjectId(req.body.booking_id);
  Booking_History.find({ _id: booking_id }, function(err, data) {
    if (err) throw err;
    res.send({
      code: 200,
      data: data,
      message: "Booking done for request"
    });
  });
});


//get the trending places from database(places frequently booked by users)

router.post("/get-hotspots", function(req, res, next) {
  Booking_History.aggregate([ {"$group" : {_id:"$dest", count:{$sum:1}}}, {$sort: {"count":-1}} ], function(err, grpbydata) {
    console.log(err);
    console.log(grpbydata);
    let res_data = [];
    for(let i = 0; i < 6; i++) {
      Places.findOne({ place_id: grpbydata[i]['_id'] }, function(err, data) {
        if (err) {
          console.log("err: ", err);
          return null;
        } else {
          console.log(data);
          res_data.push(data);
          if(i == 5) {
            res.send({
              code: 200,
              data: res_data,
              message: "Booking done for request"
            });
          }
        }
      });
    }
  });
});

//API for ticket generation in pdf form

router.post("/api/ticket_generation", function(req, res, next){
  console.log("Reached")

  var ref = "123456789"
  var mode = "Flight"
  var p_name = "Piyush"
  var src = "NB"
  var dest = "KTCHN"
  var j_date = "March 31, 2020"
  var fare = "$180.0"
  var flight_name = "West Jet"
  var flight_number = "(ROX - 218)"

  var doc = new PDFDocument;
  doc.pipe(fs.createWriteStream("ticket.pdf"));
doc.fontSize(14)
  .text('Your Booking Is Confirmed', 200, 90)
  .text("Your booking reference number is: "+ref, 130, 120)

doc.fontSize(9)
  .text("Passenger Name: "+p_name, 220, 240)
  .text("Source: "+src, 220, 260)
  .text("Destination: "+dest, 220, 280)
  .text("Journey Date: "+j_date, 220, 300)
  .text("Mode: "+mode, 220, 320)
  .text("Fare: "+fare, 220, 340)

doc.fontSize(9)
  .text(flight_name, 155, 295)
  .text(flight_number, 150, 305)

  doc.image('C:\\Users\\Piyush\\Desktop\\travel-app-api\\images\\confirmed.png', 210, 150, {width: 170, height: 70}
  // fit: [100, 100],
  );

  if (mode == "Flight")  {
  doc.image('C:\\Users\\Piyush\\Desktop\\travel-app-api\\images\\flight.png', 150, 240, {width: 50, height: 50})
  // fit: [10, 10]
  }

  else if (mode == "Bus") {
  doc.image('C:\\Users\\Piyush\\Desktop\\travel-app-api\\images\\bus.png', 150, 240, {width: 50, height: 50})
  // fit: [100, 100]
  }

  else {
    console.log("No valid mode!")
  }

  doc.end();
  res.send("OK")

});

module.exports = router;