var express = require('express');
var request = require('request');
var app     = express();
var bodyParser = require('body-parser')

var app     = express();
app.use(bodyParser.json());


app.post('/calculateSum', function(req, res){
    console.log(req.body);
    user_data = req.body;
    sum = 0;
    for(var i =0; i<user_data.length; i++)
    {
        sum += user_data[i]["num"];
        
    }
    res.send("Final Sum => " + sum);
});



app.listen('8001')
console.log('Magic happens on port 8001');
exports = module.exports = app;