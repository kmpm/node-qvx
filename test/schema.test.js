var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var debug = require('debug')('qvx:test:schema');

var fs = require('fs');
var path = require('path');
var ExtendedCursor = require('../lib/extended-cursor');

var qvx = require('..');
var Schema = qvx.Schema;
var DataTypes = qvx.DataTypes;


var EXPRESSOR_BIN_FILE = path.join(__dirname, 'fixtures', 'test_expressor.bin');


lab.experiment('Schema', function () {
  lab.test('#fromQvx(expressor)', function (done) {
    var e = require('./fixtures/test_expressor_header.json');

    var schema = Schema.fromQvx(e);
    expect(schema).to.have.property('tableName', 'test');
    expect(schema).to.have.property('useSeparator', true);
    expect(schema.fields).to.have.length(19);

    var bc = new ExtendedCursor(fs.readFileSync(EXPRESSOR_BIN_FILE))
    var recCount = 0;

    var inbound = schema.bindReadCursor(bc);
    var rec = inbound.readRecord();
    expect(rec).to.be.instanceof(Array);
    expect(rec).to.have.length(19);
    recCount++;

    while (!inbound.eof()) {
        rec = inbound.readRecord();
        recCount++;
    }
    expect(recCount).to.equal(120);

    done();
  });

  lab.test('#toQvx()', function (done) {

    var fields = {
      'AddressNumber': {type: Number},
      'ItemNumber': {type: Number},
      'InvoiceDate': {type: DataTypes.Timestamp},
      'PromisedDeliveryDate': {type: DataTypes.Timestamp}, //'2010-11-19T23:00:00.000Z',
      'Date': {type: DataTypes.Timestamp}, //'2010-11-19T23:00:00.000Z',
      'InvoiceNumber': {type: Number},
      'OrderNumber': {type: Number},
      'ItemDesc': {type: String},
      'SalesQty': {type: Number, decimal: true},
      'OpenQty': {type: Number, decimal: true},
      'OpenOrder': {type: Number},
      'GrossSales': {type: Number},
      'Sales': {type: Number},
      'BackOrder': {type: Number, decimal: true},
      'Cost': {type: Number, decimal: true},
      'Margin': {type: Number},
      'SalesKey': {type: String},
      'ofDaysLate': {type: Number},
      'ofDaystoShip': {type: Number}
    };

    var schema = new qvx.Schema({fields: fields});
    var xml = schema.toQvx({pretty: true});
    fs.writeFileSync('test.toqvx.log', xml);
    done();
  });
});
