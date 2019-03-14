'use strict';

// require('dotenv').load();

console.log(process.env.SECRET);

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();
var router = express.Router();

const dns = require('dns');
const options = {
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(process.env.MONGOLAB_URI,
  {useNewUrlParser: true},
  function(error){
    if(error) console.log(error);
    console.log("connection successful");
});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});

// Short url app
var ShortUrl = require('./models/url');

// To clean records
// ShortUrl.deleteMany({}, function(err, users) {
//   if (err) throw err;
//   // object of all the users
//   console.log('Remove old records');
// });

// Redirect
app.get("/api/shorturl/:id", function (req, res) {
    ShortUrl.find({"short_url": req.params.id}, (err,data)=>{
      if (err) { return console.log("Error: app.get")}
      if (data.length>0){
        console.log("Redirect")
        res.redirect(data[0]["original_url"]);
      } else {
        res.json({"error":"invalid short URL"})
      }
    });
});

// New short urls
var createAndSaveUrl = function(orig,short,done){
  console.log('create!')
  var newUrl = new ShortUrl({
  "original_url": orig,
  "short_url": short
  });
  newUrl.save(function(err){
    if (err) { return console.log("Error: save newUrl")};
    console.log('New shorturl created, id: ',short)
    return
  });
};

// Find records
var findRecords = function(res,url,next){
  ShortUrl.find({"original_url": url}, (err,data)=>{
    if (err) { return console.log("Error: find original url")}
    return next(res,data,url)
  })
}

var countDocAndCreate = function(res,url){
  ShortUrl.countDocuments({}, function(err, count) {
    if (err) { return console.log("Error: coundDocuments") }
    var id = count+1
    createAndSaveUrl(url,id)
    res.json({
          "original_url": url,
          "short_url": id
    });
  });
}

var createOrPostRecord = function(res,data,url){
  if (data.length===0){
    countDocAndCreate(res,url)
  } else {
    console.log("Find old record, id: ",data[0]["short_url"])
    res.json({
          "original_url": url,
          "short_url": data[0]["short_url"]
    });
  }
}

// post
app.post('/api/shorturl/new',(req,res)=>{
  var url = req.body.url;
  var urlSplit = url.split('//')
  urlSplit = urlSplit[urlSplit.length-1];
  // Check if the url is valid
  dns.lookup(urlSplit, options, (err, addresses) =>{
    if (addresses === undefined){
      res.json({"error":"invalid URL"});
    } else {
      findRecords(res,url,createOrPostRecord)
      // // Check if record exists
      // ShortUrl.find({"original_url": url}, (err,data)=>{
      //   if (err) { return console.log("Error: find original url")}
      //   if (data.length===0){
      //     ShortUrl.countDocuments({}, function(err, count) {
      //         if (err) { return console.log("Error: coundDocuments") }
      //         var id = count+1
      //         createAndSaveUrl(url,id);
      //         res.json({
      //               "original_url": url,
      //               "short_url": id
      //       });
      //     });
      //   } else {
      //     console.log("Find old record, id: ",data[0]["short_url"])
      //     res.json({
      //           "original_url": url,
      //           "short_url": data[0]["short_url"]
      //     });
      //   }
      // });
    }
  });
});
