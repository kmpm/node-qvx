/*eslint no-process-exit: 0  */
var fs = require('fs');
var qvx = require('..');

var JSONStream = require('JSONStream');

exports.run = function () {
  var filename = process.argv[2];
  if (!fs.existsSync(filename)) {
    console.log('File "%s" is missing', filename);
    process.exit(1);
  }
  var inbound = new qvx.Inbound({objectFormat: 'array'});
  var fileStream = fs.createReadStream(filename);

  var stringify = JSONStream.stringify(false);

  fileStream
  .pipe(inbound)
  .pipe(stringify)
  .pipe(process.stdout);

  // inbound.on('line', function (line) {
  //   var j = JSON.stringify(line);
  //   console.log(j);
  // });
};
