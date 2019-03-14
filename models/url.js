// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var urlSchema = new Schema({
  "original_url": {type: String, required:true},
  "short_url":{type:Number, requried:true},
  created_at: Date,
  updated_at: Date
});

// the schema is useless so far
// we need to create a model using it
var ShortUrl = mongoose.model('shortUrl',urlSchema);

// make this available to our users in our Node applications
module.exports = ShortUrl;
