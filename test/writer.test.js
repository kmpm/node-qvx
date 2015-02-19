var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('code').expect;


// var streams = require('memory-streams');
// var concat = require('concat-stream');

var fs = require('fs');
var path = require('path');

var qvx = require('../');

lab.experiment('Writer', function () {
  lab.test('write', function (done) {
    var header = fs.readFileSync(path.join(__dirname, 'test_expressor_header.json'));
    header = JSON.parse(header);

    var reader = qvx.Writer.write(header);
    //console.log(reader);
    //expect(reader).to.be.a('string');
    expect(reader).to.have.length(7503);
    done();
    // reader.pipe(concat(function (body) {
    //   console.log(body);
    //   done();
    // }));


  });
});
