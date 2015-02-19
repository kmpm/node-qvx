
var fs = require('fs');

var Reader = require('./reader');

exports.run = function () {
  var filename = process.argv[2];
  var reader = new Reader({objectFormat: 'object'});
  var fileStream = fs.createReadStream(filename);
  fileStream.pipe(reader);

  reader.on('line', function (line) {
    var j = JSON.stringify(line);
    console.log(j);
  });
};
