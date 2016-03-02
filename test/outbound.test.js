var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;

var describe = lab.experiment;
var it = lab.test;


var fs = require('fs');
var path = require('path');
var glob = require('glob');
var es = require('event-stream');
var concat = require('concat-stream');

var qvx = require('../');
var helpers = require('./helpers');

var Cursor = require('../lib/extended-cursor');
var xml2js = require('xml2js');
var parser = new xml2js.Parser({explicitArray: false});

describe('Outbound', function () {

  it('should construct', function (done) {
    var schema = new qvx.Schema();
    var outbound = new qvx.Outbound(schema);
    expect(outbound).to.be.instanceof(qvx.Outbound);
    done();
  });


  it('should transform', function (done) {
    var fields = {
      'AddressNumber': {type: Number},
      'ItemNumber': {type: Number, field: 'signed', bytes: 8, decimals: 0},
      'InvoiceDate': {type: Date},
      'PromisedDeliveryDate': {type: Date}, //'2010-11-19T23:00:00.000Z',
      'Date': {type: Date}, //'2010-11-19T23:00:00.000Z',
      'InvoiceNumber': {type: Number},
      'OrderNumber': {type: Number},
      'ItemDesc': {type: String},
      'SalesQty': {type: Number, bytes: 8, field: 'signed', decimals: 0},
      'OpenQty': {type: Number, bytes: 8, field: 'signed', decimals: 0},
      'OpenOrder': {type: Number, field: 'signed', bytes: 8, decimals: 0},
      'GrossSales': {type: Number, field: 'signed', bytes: 8, decimals: 0},
      'Sales': {type: Number, field: 'signed', bytes: 8, decimals: 0},
      'BackOrder': {type: Number, field: 'signed', bytes: 8, decimals: 0},
      'Cost': {type: Number, field: 'bcd', extent: 'fix', decimals: 4, bytes: 18},
      'Margin': {type: Number, field: 'bcd', extent: 'fix', decimals: 4, bytes: 18},
      'SalesKey': {type: String},
      'ofDaysLate': {type: Number, field: 'signed', decimals: 0},
      'ofDaystoShip': {type: Number, field: 'signed', decimals: 0}
    };

    var schema = new qvx.Schema({
      createdAt: '2012-03-06 19:22:15',
      creator: false,
      tableName: 'test',
      fields: fields
    });

    var data = {
      'AddressNumber': 10022755,
      'ItemNumber': 10821,
      'InvoiceDate': null,
      'PromisedDeliveryDate': new Date(2010, 10, 20, 0, 0, 0),
      'Date': new Date(2010, 10, 20, 0, 0, 0),
      'InvoiceNumber': null,
      'OrderNumber': 214657,
      'ItemDesc': 'Ebony Lemons',
      'SalesQty': null,
      'OpenQty': null,
      'OpenOrder': null,
      'GrossSales': null,
      'Sales': null,
      'BackOrder': 100,
      'Cost': null,
      'Margin': null,
      'SalesKey': '11/01/2010_10022755_118',
      'ofDaysLate': null,
      'ofDaystoShip': null
    };

    var reader = es.readArray([data]);
    var outbound = new qvx.Outbound(schema);

    reader.pipe(outbound)
    .pipe(concat(function (body) {
      expect(body.length).to.be.above(1000);
      fs.writeFileSync(path.join(__dirname, 'tmp', 'test.qvx'), body);
      var actual = new Buffer(body);
      var expected = fs.readFileSync(path.join(__dirname, 'fixtures', 'test_expressor_single.qvx'));
      var size = 200;
      for (var i = 0; i < actual.length; i += size) {
        expect(actual.slice(i, i + size).toString('utf-8'), i).to.eql(expected.slice(i, i + size).toString('utf-8'));
      }
      done();
    }));

  });


  it('aaaahrrdd', function (done) {
    var fields = {
      'AddressNumber': {type: Number},
      'ItemNumber': {type: Number, field: 'signed', bytes: 8, decimals: 0},
      'InvoiceDate': {type: Date},
      'PromisedDeliveryDate': {type: Date}, //'2010-11-19T23:00:00.000Z',
      'Date': {type: Date}, //'2010-11-19T23:00:00.000Z',
      'InvoiceNumber': {type: Number},
      'OrderNumber': {type: Number},
      'ItemDesc': {type: String},
      'SalesQty': {type: Number, bytes: 8, decimals: 0},
      'OpenQty': {type: Number, bytes: 8, decimals: 0},
      'OpenOrder': {type: Number, field: 'signed', bytes: 8, decimals: 0},
      'GrossSales': {type: Number, field: 'signed', bytes: 8, decimals: 0},
      'Sales': {type: Number, field: 'signed', bytes: 8, decimals: 0},
      'BackOrder': {type: Number, field: 'signed', bytes: 8, decimals: 0},
      'Cost': {type: Number, field: 'bcd', extent: 'fix', decimals: 4, bytes: 18},
      'Margin': {type: Number, field: 'bcd', extent: 'fix', decimals: 4, bytes: 18},
      'SalesKey': {type: String},
      'ofDaysLate': {type: Number, decimals: 0},
      'ofDaystoShip': {type: Number, decimals: 0}
    };

    var schema = new qvx.Schema({
      createdAt: '2012-03-06 19:22:15',
      creator: false,
      tableName: 'test',
      fields: fields
    });

    var outbound = new qvx.Outbound(schema, {recordFormat: 'object'});

    var file = fs.createWriteStream(path.join(__dirname, 'tmp', 'streamed.qvx'));

    fs.createReadStream(path.join(__dirname, 'fixtures', 'test_expressor.qvx.json'))
    .pipe(es.split())
    .pipe(es.parse())
    .pipe(outbound)
    .pipe(file);

    file.on('close', done);

  });

  describe('fixtures', function () {
    glob.sync(path.join(__dirname, 'fixtures/*.qvx')).forEach(testOutbound);
  });

  describe('private', function () {
    glob.sync('./private/*.qvx').forEach(testOutbound);
  });

});//--Writer


function testOutbound(qvxFile) {
  var basename = path.basename(qvxFile);
  it(basename, function (done) {
    // console.log('testing', qvxFile);
    var schema;

    var dataFile = qvxFile.replace('.qvx', '.qvx.json');
    var schemaFile = qvxFile.replace('.qvx', '.schema.json');

    if(!fs.existsSync(schemaFile)) {
      //create it
      var buf = fs.readFileSync(qvxFile);
      var cursor = new Cursor(buf);
      var xml = cursor.readZeroString();
      parser.parseString(xml, function (err, obj) {
        if (err) {
          return done(err);
        }
        schema = qvx.Schema.fromQvx(obj);
        fs.writeFileSync(schemaFile, JSON.stringify(schema));
        return done(new Error('rerun test'));
      });
      return;
    }
    // console.log('schemafile exists');
    var schemaSpec = require(schemaFile);
    schema = new qvx.Schema(schemaSpec);
    expect(schema.tableName).to.equal(schemaSpec.tableName);
    expect(schema.createdAt).to.equal(schemaSpec.createdAt);

    expect(schema.fields).to.have.length(schemaSpec.fields.length);
    expect(schema.fields[0]).to.have.property('name', schemaSpec.fields[0].name);
    var outbound = new qvx.Outbound(schema, {recordFormat: 'object'});


    fs.createReadStream(dataFile)
    .pipe(es.split())
    .pipe(es.parse())
    .pipe(outbound)
    .pipe(concat(function (body) {
      var actual = helpers.splitQvx(body);
      var expected = helpers.splitQvx(fs.readFileSync(qvxFile));

      helpers.equalBuffer(expected, actual);
      helpers.equalXmlHeader(expected.xml, actual.xml, function (err) {
        done(err);
      });
    }));
  });//..it Inbound
}//--testInbound
