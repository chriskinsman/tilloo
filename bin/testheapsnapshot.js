const { writeHeapSnapshot } = require('v8');
function dump() {
    const fileName = '/var/log/' + Date.now() + '.heapsnapshot';
    console.info('Writing heapsnapshot to: ' + fileName);
    writeHeapSnapshot(fileName);
}
dump();

setInterval(function () {
    dump();
}, 1000 * 60);
