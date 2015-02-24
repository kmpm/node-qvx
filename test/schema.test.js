var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.experiment;
var it = lab.test;


var fs = require('fs');
var path = require('path');
var ExtendedCursor = require('../lib/extended-cursor');

var qvx = require('..');
var Schema = qvx.Schema;
var DataTypes = qvx.DataTypes;


var EXPRESSOR_BIN_FILE = path.join(__dirname, 'fixtures', 'test_expressor.bin');


describe('Schema', function () {

  describe('from json spec', function () {
    it('should create type:"Date"', function (done) {
      var schema = new Schema({
        InvoiceDate: {type: 'Date'}
      });

      expect(schema.paths).to.have.property('InvoiceDate')
      .to.be.instanceof(qvx.DataTypes.Date)
      .to.include({
        field: 'text',
        bytes: 1,
        endian: 'little',
        extent: 'counted',
        whenNull: 'supress',
        encoding: 'utf-8',
      })
      .to.have.property('format')
      .to.include({
        type: 'TIMESTAMP',
        fmt: 'YYYY-MM-DD HH:mm:ss'
      });
      // console.log(schema.paths.InvoiceDate);
      done();
    });
  });

  describe('toQvx', function () {
    it('should have Double (AddressNumber)', function (done) {
      var schema = new Schema({
        AddressNumber: {type: Number}
      });

      expect(schema.paths.AddressNumber).to.be.instanceof(qvx.DataTypes.Number);
      expect(schema.paths.AddressNumber).to.have.property('type', 'Number');

      var addrSpec = schema.paths.AddressNumber.toQvxSpec();
      expect(addrSpec).to.include({
        FieldName: 'AddressNumber',
        Type: 'QVX_IEEE_REAL',
        Extent: 'QVX_FIX',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: false,
        CodePage: 65001,
        ByteWidth: 8
      });
      done();
    });


    it('should have Int64 (ItemNumber)', function (done) {
      var schema = new Schema({
        ItemNumber: {type: Number, field: 'signed', bytes: 8, decimals: 0},
      });

      var spec = schema.paths.ItemNumber.toQvxSpec();
      expect(spec).to.include({
        FieldName: 'ItemNumber',
        Type: 'QVX_SIGNED_INTEGER',
        Extent: 'QVX_FIX',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: false,
        CodePage: 65001,
        ByteWidth: 8,
        FixPointDecimals: 0
      });
      done();
    });


    it('should have Date (InvoiceDate)', function (done) {
      var schema = new Schema({
        InvoiceDate: {type: Date},
      });

      var spec = schema.paths.InvoiceDate.toQvxSpec();
      expect(spec).to.include({
        FieldName: 'InvoiceDate',
        Type: 'QVX_TEXT',
        Extent: 'QVX_COUNTED',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: false,
        CodePage: 65001,
        ByteWidth: 1
      });
      expect(spec.FieldFormat).to.include({
        Type: 'TIMESTAMP',
        Fmt: 'YYYY-MM-DD HH:mm:ss'
      });
      done();
    });



    it('should have string (ItemDesc)', function (done) {
      var schema = new Schema({
        ItemDesc: {type: String}
      });
      var spec = schema.paths.ItemDesc.toQvxSpec();
      expect(spec).to.include({
        FieldName: 'ItemDesc',
        Type: 'QVX_TEXT',
        Extent: 'QVX_COUNTED',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: false,
        CodePage: 65001,
        ByteWidth: 4
      });
      done();
    });


    it('should have bcd (Margin)', function (done) {
      var schema = new Schema({
        Margin: {type: Number, field: 'bcd', bytes: 18, decimals: 4, extent: 'fix'}
      });

      var spec = schema.paths.Margin.toQvxSpec();
      expect(spec).to.include({
        FieldName: 'Margin',
        Type: 'QVX_PACKED_BCD',
        Extent: 'QVX_FIX',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: false,
        CodePage: 65001,
        ByteWidth: 18,
        FixPointDecimals: 4
      });
      done();
    });
  });

  describe('fromQvx', function () {

    it('should suppor test_expressor', function (done) {
      var e = require('./fixtures/test_expressor_header.json');
      var schema = Schema.fromQvx(e);

      var margin = schema.paths.Margin;
      expect(margin).to.deep.include({
        field: 'bcd',
        decimals: 4,
        bytes: 18,
        endian: 'little',
        extent: 'fix',
        whenNull: 'supress',
        encoding: 'utf-8'
      });


      var itemDesc = schema.paths.ItemDesc;
      expect(itemDesc).to.deep.include({
        field: 'text',
        bytes: 4,
        endian: 'little',
        extent: 'counted',
        whenNull: 'supress',
        encoding: 'utf-8'
      });

      expect(itemDesc).to.be.instanceof(qvx.DataTypes.String);
      expect(itemDesc).to.have.property('type', 'String');


      var invoiceDate = schema.paths.InvoiceDate;
      expect(invoiceDate).to.include({
        field: 'text',
        bytes: 1,
        endian: 'little',
        extent: 'counted',
        whenNull: 'supress',
        encoding: 'utf-8',
      })
      .to.have.property('format')
      .to.include({
        fmt: 'YYYY-MM-DD HH:mm:ss',
        type: 'TIMESTAMP'
      });

      expect(Object.keys(schema.paths)).to.have.length(19);
      //console.log('asdf %j', schema);
      done();
    })

  });
});
