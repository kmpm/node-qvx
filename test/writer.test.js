var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('code').expect;



// var streams = require('memory-streams');
// var concat = require('concat-stream');

var fs = require('fs');
var path = require('path');

var qvx = require('../');
var QvxField = qvx.QvxField;
var DataTypes = QvxField.DataTypes;

var helper = require('./helper');

lab.experiment('Writer', function () {

  lab.test('#headerToXml', function (done) {

    var writer = helper.createWriter();
    var xml = writer.headerToXml();
    fs.writeFileSync('test.headerToXml.log', xml);
    done();
  });


  lab.test('Transform', function (done) {
    var writer = helper.createWriter();
    var src = require('./fixtures/expressor_single_hash.json');


  })

});//--Writer
