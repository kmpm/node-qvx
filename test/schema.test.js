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
      'AddressNumber': {type: DataTypes.FLOAT(8)},
      'ItemNumber': {type: DataTypes.BIGINT().DECIMALS(0)},
      'InvoiceDate': {type: DataTypes.TIMESTAMP},
      'PromisedDeliveryDate': {type: DataTypes.TIMESTAMP}, //'2010-11-19T23:00:00.000Z',
      'Date': {type: DataTypes.TIMESTAMP}, //'2010-11-19T23:00:00.000Z',
      'InvoiceNumber': {type: DataTypes.FLOAT(8)},
      'OrderNumber': {type: DataTypes.FLOAT(8)},
      'ItemDesc': {type: DataTypes.STRING('utf-8', 4)},
      'SalesQty': {type: DataTypes.BIGINT()},
      'OpenQty': {type: DataTypes.BIGINT()},
      'OpenOrder': {type: DataTypes.BIGINT()},
      'GrossSales': {type: DataTypes.BIGINT()},
      'Sales': {type: DataTypes.BIGINT()},
      'BackOrder': {type:  DataTypes.BIGINT()},
      'Cost': {type: DataTypes.BCD(18).DECIMALS(4)},
      'Margin': {type: DataTypes.BCD(18).DECIMALS(4)},
      'SalesKey': {type: DataTypes.STRING('utf-8', 4)},
      'ofDaysLate': {type: DataTypes.BIGINT()},
      'ofDaystoShip': {type: DataTypes.BIGINT()}
    };

    var schema = new qvx.Schema({
      createdAt: '2015-02-23T13:57:03',
      fields: fields
    });
    var xml = schema.toQvx({pretty: true});
    fs.writeFileSync(path.join(__dirname, 'tmp', 'schema.xml'), xml);
    var expected = fs.readFileSync(path.join(__dirname, 'fixtures', 'schema.xml')).toString();
    expect(xml).to.deep.eql(expected);
    done();
  });
});
