#! /usr/bin/env node
'use strict';

const path = require('path');
const http = require('http');

const mongoose = require('mongoose');
const express = require('express');
const compression = require('compression');
//const morgan = require('morgan');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');

const config = require('../lib/config');

mongoose.connect(config.db);
mongoose.Promise = global.Promise;

const app = express();

// Routes
const job = require('./routes/job');

// All environments
app.set('port', process.env.PORT || 80);
//app.use(morgan('dev'));
app.use(compression());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon(path.join(__dirname, '/public/assets/favicon.ico')));
app.use('/node_modules', express.static(path.join(__dirname, 'public/node_modules')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/api/config', express.static(path.join(__dirname, '../config/config.json')));
app.get('/api/job', job.getJobs);
app.post('/api/job/create', job.createJob);
app.get('/api/job/:jobId', job.getJob);
app.get('/api/job/run/:runId', job.getJobByRunId);
app.get('/api/job/:jobId/runs', job.getRuns);
app.post('/api/job/:jobId/delete', job.deleteJob);
app.post('/api/job/:jobId/run', job.triggerRun);
app.post('/api/job/:jobId/update', job.updateJob);
app.get('/api/run/:runId', job.getRun);
app.get('/api/run/:runId/output', job.outputForRun);
app.post('/api/run/:runId/stop', job.stopRun);

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.use(function (err, req, res, next) {
    console.dir(err);
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: err
    });
});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
