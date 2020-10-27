#! /usr/bin/env node
'use strict';

const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');
const favicon = require('serve-favicon');
const http = require('http');
const path = require('path');

const mongoose = require('../../lib/mongooseinit');

// Routes
const routes = require('./routes');

const app = express();

// All environments
app.set('port', process.env.PORT || 3050);
//app.use(morgan('dev'));
app.use(compression());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use('/node_modules', express.static(path.join(__dirname, 'public/node_modules')));


app.use('/api/config', express.static(path.join(__dirname, '../../config/config.json')));
app.get('/api/job', routes.getJobs);
app.post('/api/job/create', routes.createJob);
app.get('/api/job/:jobId', routes.getJob);
app.get('/api/job/run/:runId', routes.getJobByRunId);
app.get('/api/job/:jobId/runs', routes.getRuns);
app.post('/api/job/:jobId/delete', routes.deleteJob);
app.post('/api/job/:jobId/run', routes.triggerRun);
app.post('/api/job/:jobId/update', routes.updateJob);
app.get('/api/run/:runId', routes.getRun);
app.get('/api/run/:runId/output', routes.outputForRun);
app.post('/api/run/:runId/stop', routes.stopRun);

if (process.env.NODE_ENV === 'production') {
    app.use(favicon(path.join(__dirname, '../client/dist/favicon.ico')));
    app.use('/', express.static(path.join(__dirname, '../client/dist')));
}
else {
    console.log('Debug environment not mounting public or favicon.ico');
}

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
