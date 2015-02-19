var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('code').expect;

var fs = require('fs');
var path = require('path');
var concat = require('concat-stream');

var qvx = require('../');


lab.experiment('Reader', function () {
  lab.test('read', function (done) {

    var reader = new qvx.Reader();
    var fileStream = fs.createReadStream(path.join(__dirname, 'test_expressor.qvx'));
    fileStream.pipe(reader).pipe(concat(function (body) {
      expect(body).to.exist();
      //console.log(body.toString());
      done();
    }));

    reader.on('header', function (header) {
      expect(header).to.exist();
      // expect(header.QvxTableHeader).to.deep.include({
      //   MajorVersion: '1',
      //   MinorVersion: '0'
      // });
      //console.log('%j', header);

    });



  });
});
