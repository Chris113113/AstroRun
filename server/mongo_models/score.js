var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scoreSchema = new Schema ({
    username : String,
    score : Number
});

mongoose.model('scores', scoreSchema);
