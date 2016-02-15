var socket = require('socket.io-client')('http://localhost:7700');


console.info('Listening to http://localhost:7700 for status changes');
socket.on('status', function(message) {
    console.dir(message);
});