#! /usr/bin/env node
'use strict';

const express = require('express');
const favicon = require('serve-favicon');
const http = require('http');
const path = require('path');

// Routes
const configureAPI = require('./configure');

const app = express();
app.set('port', process.env.PORT || 80);

app.use(favicon(path.join(__dirname, '../client/dist/favicon.ico')));

configureAPI.before(app);

// UI
const publicPath = path.resolve(__dirname, '../client/dist');
const staticConf = { maxAge: '1y', etag: false };

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
