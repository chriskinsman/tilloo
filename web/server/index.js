#! /usr/bin/env node
'use strict';

const express = require('express');
const favicon = require('serve-favicon');
const http = require('http');
const path = require('path');
const history = require('connect-history-api-fallback');

const mongoose = require('../../lib/mongooseinit');

// Routes
const routes = require('./routes');

const app = express();
app.set('port', process.env.PORT || 80);

app.use(favicon(path.join(__dirname, '../client/dist/favicon.ico')));

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

// UI
const publicPath = path.resolve(__dirname, '../client/dist');
const staticConf = { maxAge: '1y', etag: false };

app.use(history());
app.use(express.static(publicPath, staticConf));

app.get('/', function (req, res) {
    res.render(path.join(__dirname, '../client/dist/index.html'));
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
