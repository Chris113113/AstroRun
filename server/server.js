var express = require('express')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var app = express();
mongoose.connect('mongodb://localhost/AstroRunDB');

app.use(express.static('../public'));



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

require(__dirname+'/mongo_models/score.js');
var Score = mongoose.model('scores');
var numLeaders = 100;


app.get('/', function(req, res){
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/addScore', function(req, res){
    var score = new Score ({
        username : req.body.username,
        score : req.body.totSeconds
    });

    if(score.score === undefined) {
        res.json({
            success    : false,
            errMessage : "Could not save score. Score was undefined"
        });
        return;
    }

    if(score.username === undefined || score.username === '') {
        res.json({
            success    : false,
            errMessage : "Could not save score. Username was undefined"
        });
        return;
    }

    console.log('Saving score', score.username, ':', score.score);

    score.save(function(err){
        if(err){
            console.log("Error saving the users score " + err);
            res.json({
                success : false,
                errMessage : "Could not save user."
            });
            return;
        }
        res.json({
            success : true
        });
        return;
    });
});

app.get('/getHighScores', function(req, res){
    Score.find().sort({score : -1}).exec(function(err, docs){
        if(err) {
            console.log("Error finding high scores.");
            res.json({
                success: false,
                errMessage: "Could not find scores"
            });
            return;
        }
        var leaders = [];
        var leaderCounter = 0;

        for(var i = 0; i<docs.length; i++){
            if(docs[i] && leaderCounter < numLeaders){
                leaders.push(docs[i]);
                leaderCounter += 1;
            }
        }
        formatLeaderboard(leaders, function(err, newLeaders){
            if(err){
                res.json({
                    success : false,
                    errMessage : "Error formatting the leaderboard"
                });
                return;
            }
            else{
                res.json({
                    success : true,
                    leaders : newLeaders
                });
            }
        });
    });
});

function formatLeaderboard(leaders, fn){
    var formattedLeaders = [];

    for(var i = 0; i<leaders.length; i++){
        var tempLeader = {
            username : "",
            score : ""
        }
        tempLeader.username = leaders[i].username;

        var min = Math.floor(leaders[i].score / 60);
        var sec = leaders[i].score % 60;
        var scoreString = "";

        if(sec < 10){
            scoreString = min.toString() + ":0" + sec.toString();
        }
        else{
            scoreString = min.toString() + ":" + sec.toString();
        }
        tempLeader.score = scoreString;
        formattedLeaders.push(tempLeader);

    }
    return fn(null, formattedLeaders);
}

// This is the fix
app.get(/^(.+)$/, function(req, res) {
    res.sendFile(__dirname + '/public/' + req.params[0]);
});

var portNumber = 80;
app.listen(portNumber);

console.log("AstroRun Server is listening on port " + portNumber);

