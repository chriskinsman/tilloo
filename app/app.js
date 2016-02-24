'use strict';

var path = require('path');
var http = require('http');

var mongoose = require('mongoose');
var express = require('express');
var compression = require('compression');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');

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
app.use(favicon(__dirname + '/public/assets/favicon.ico'));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/api/job', job.getJobs);
app.post('/api/job/create', job.createJob);
app.get('/api/job/:jobId', job.getJob);
app.get('/api/job/:jobId/runs', job.getRuns);
app.post('/api/job/:jobId/delete', job.deleteJob);
app.post('/api/job/:jobId/run', job.triggerRun);
app.post('/api/job/:jobId/update', job.updateJob);
app.get('/api/run/:runId', job.getRun);
app.get('/api/run/:runId/output', job.outputForRun);
app.post('/api/run/:runId/stop', job.stopRun);

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
