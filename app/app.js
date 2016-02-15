'use strict';

var path = require('path');
var http = require('http');

var mongoose = require('mongoose');
var express = require('express');
var compression = require('compression');
var morgan = require('morgan');
var bodyParser = require('body-parser');

var config = require('../lib/config');

mongoose.connect(config.db);

var app = express();

// Routes
var job = require('./routes/job');

// All environments
app.set('port', process.env.PORT || 7770);
app.use(morgan("dev"));
app.use(compression());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/api/job', job.list);
app.get('/api/job/detail', job.runDetailList);

app.get('*', function(req, res){ res.sendFile(__dirname + '/public/index.html');});

app.use(function(err, req, res, next) {
    console.dir(err);
    res.status(err.status || 500);
    res.send( {
        message: err.message,
        error: err
    });
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
