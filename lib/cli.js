/*eslint no-process-exit: 0  */
var fs = require('fs');
var qvx = require('..');


exports.run = function () {
  var filename = process.argv[2];
  if (!fs.existsSync(filename)) {
    console.log('File "%s" is missing', filename);
    process.exit(1);
  }
  var inbound = new qvx.Inbound({objectFormat: 'array'});
  var fileStream = fs.createReadStream(filename);
  fileStream.pipe(inbound);

  inbound.on('line', function (line) {
    var j = JSON.stringify(line);
    console.log(j);
  });
};
