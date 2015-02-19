var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('code').expect;

var fs = require('fs');
var path = require('path');
var concat = require('concat-stream');
var JSONStream = require('JSONStream');

var qvx = require('../');


lab.experiment('Reader', function () {
  lab.test('read as object', function (done) {

    var reader = new qvx.Reader({objectFormat: 'object'});
    var fileStream = fs.createReadStream(path.join(__dirname, 'fixtures', 'test_expressor.qvx'));
    var stringify = JSONStream.stringify(false);

    var lineCount = 0;
    var headerCount = 0;

    fileStream.pipe(reader)
    .pipe(stringify)
    .pipe(concat(function (body) {
      expect(body).to.exist();
      expect(headerCount).to.equal(1);
      expect(lineCount).to.be.above(0);
      var objs = body.split('\n');
      expect(objs, 'same as lineCount').to.have.length(lineCount);
      expect(objs).to.have.length(120);

      var obj = JSON.parse(objs[0]);
      expect(obj).to.be.instanceof(Object);
      expect(obj).to.include(['AddressNumber', 'ItemNumber']);
      expect(Object.keys(obj)).to.have.length(19);
      fs.writeFileSync('test.reader.hash.log', body);
      done();
    }));

    reader.on('line', function (line) {
      expect(line).to.exist();
      lineCount++;
    });

    reader.on('header', function (header) {
      expect(header).to.exist();
      headerCount++;
    });

  });//--read ad object


  lab.test('read as array', function (done) {

    var reader = new qvx.Reader({objectFormat: 'array'});
    var fileStream = fs.createReadStream(path.join(__dirname, 'fixtures', 'test_expressor.qvx'));
    var stringify = JSONStream.stringify(false);

    var lineCount = 0;

    fileStream.pipe(reader)
    .pipe(stringify)
    .pipe(concat(function (body) {
      expect(body).to.exist();
      expect(lineCount).to.be.above(0);
      fs.writeFileSync('test.reader.array.log', body);
      var objs = body.split('\n');
      expect(objs, 'same as lineCount').to.have.length(lineCount);
      expect(objs).to.have.length(120);
      var obj = JSON.parse(objs[0]);
      expect(obj).to.be.instanceof(Array);
      expect(obj).to.have.length(19);

      done();
    }));

    reader.on('line', function (line) {
      expect(line).to.exist();
      lineCount++;
    });

  });//--read as array
});
