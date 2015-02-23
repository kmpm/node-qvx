var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;

var describe = lab.experiment;
var it = lab.test;


var fs = require('fs');
var path = require('path');
var es = require('event-stream');
var concat = require('concat-stream');

var qvx = require('../');
var DataTypes = qvx.DataTypes;


describe('Outbound', function () {

  it('should construct', function (done) {
    var schema = new qvx.Schema();
    var outbound = new qvx.Outbound(schema);
    done();
  });


  it('should transform', function (done) {
    var fields = {
      'AddressNumber': {type: DataTypes.FLOAT(8)},
      'ItemNumber': {type: DataTypes.BIGINT().DECIMALS(0)},
      'InvoiceDate': {type: DataTypes.TIMESTAMP('utf-8', 1)},
      'PromisedDeliveryDate': {type: DataTypes.TIMESTAMP}, //'2010-11-19T23:00:00.000Z',
      'Date': {type: DataTypes.TIMESTAMP}, //'2010-11-19T23:00:00.000Z',
      'InvoiceNumber': {type: DataTypes.FLOAT(8)},
      'OrderNumber': {type: DataTypes.FLOAT(8)},
      'ItemDesc': {type: DataTypes.STRING('utf-8', 4)},
      'SalesQty': {type: DataTypes.BIGINT().DECIMALS(0)},
      'OpenQty': {type: DataTypes.BIGINT().DECIMALS(0)},
      'OpenOrder': {type: DataTypes.BIGINT().DECIMALS(0)},
      'GrossSales': {type: DataTypes.BIGINT().DECIMALS(0)},
      'Sales': {type: DataTypes.BIGINT().DECIMALS(0)},
      'BackOrder': {type:  DataTypes.BIGINT().DECIMALS(0)},
      'Cost': {type: DataTypes.BCD(18).DECIMALS(4)},
      'Margin': {type: DataTypes.BCD(18).DECIMALS(4)},
      'SalesKey': {type: DataTypes.STRING('utf-8', 4)},
      'ofDaysLate': {type: DataTypes.BIGINT().DECIMALS(0)},
      'ofDaystoShip': {type: DataTypes.BIGINT().DECIMALS(0)}
    };

    var schema = new qvx.Schema({
      createdAt: '2012-03-06 19:22:15',
      tableName: 'test',
      recordFormat: 'object',
      fields: fields
    });

    var data = {
      'AddressNumber': 10022755,
      'ItemNumber': 10821,
      'InvoiceDate': null,
      'PromisedDeliveryDate': new Date(2010, 10, 20, 00, 00, 00),
      'Date': new Date(2010, 10, 20, 00, 00, 00),
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
      var size = 100;
      for (var i = 0; i < actual.length; i += size) {
        expect(actual.slice(i, i + size).toString('utf-8'), i).to.eql(expected.slice(i, i + size).toString('utf-8'));
      }
      done();
    }));

  });


  // lab.test('Transform', function (done) {
  //   var writer = helper.createWriter();
  //   var src = require('./fixtures/expressor_single_hash.json');


  // })

});//--Writer
