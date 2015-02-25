var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.experiment;
var it = lab.test;


var qvx = require('..');
var Schema = qvx.Schema;
var Cursor = require('../lib/extended-cursor');


describe('Schema', function () {

  describe('from json spec', function () {
    it('should create type:"Date"', function (done) {
      var schema = new Schema({
        InvoiceDate: {type: 'Date'}
      });

      expect(schema.fields[0])
      .to.be.instanceof(qvx.Schema.Types.Date)
      .to.include({
        name: 'InvoiceDate',
        field: 'text',
        bytes: 1,
        endian: 'little',
        extent: 'counted',
        whenNull: 'supress',
        encoding: 'utf-8',
        wireFormat: 'String'
      })
      .to.have.property('format')
      .to.include({
        type: 'TIMESTAMP',
        fmt: 'YYYY-MM-DD HH:mm:ss'
      });
      // console.log(schema.fields.InvoiceDate);
      done();
    });
  });

  describe('toQvx', function () {
    it('should have Double (AddressNumber)', function (done) {
      var schema = new Schema({
        AddressNumber: {type: Number}
      });

      expect(schema.fields[0]).to.be.instanceof(qvx.Schema.Types.Number)
      .to.include({
        type: 'Number',
        wireFormat: 'DoubleLE'
      });

      var addrSpec = schema.fields[0].toQvxSpec();
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


    it('should have Int64LE (ItemNumber)', function (done) {
      var schema = new Schema({
        ItemNumber: {type: Number, field: 'signed', bytes: 8, decimals: 0}
      });

      var f = schema.fields[0];

      expect(f).to.include({
        wireFormat: 'Int64LE'
      });

      var spec = f.toQvxSpec();
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

      var buf = new Buffer([0, 0, 0, 0, 0, 0, 1, 1, 1]);
      var cursor = new Cursor(buf);
      var result = f.read(cursor);
      expect(result).to.equal('72339069014638592');
      expect(fn).to.throw(Error);

      function fn(){
        f.read(Date);
      }

      done();
    });


    it('should have Date (InvoiceDate)', function (done) {
      var schema = new Schema({
        InvoiceDate: {type: Date}
      });

      expect(schema.fields[0]).to.include({
        wireFormat: 'String'
      });

      var spec = schema.fields[0].toQvxSpec();
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
        Fmt: 'YYYY-MM-DD hh:mm:ss'
      })
      .to.not.have.keys('nDec', 'Dec', 'Thou', 'UseThou');
      done();
    });


    it('should have string (ItemDesc)', function (done) {
      var schema = new Schema({
        ItemDesc: {type: String}
      });

      expect(schema.fields[0]).to.include({
        wireFormat: 'String'
      });

      var spec = schema.fields[0].toQvxSpec();
      expect(spec).to.include({
        FieldName: 'ItemDesc',
        Type: 'QVX_TEXT',
        Extent: 'QVX_COUNTED',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: false,
        CodePage: 65001,
        ByteWidth: 4
      })
      .to.not.have.property('FixPointDecimals');
      done();
    });


    it('should have bcd (Margin)', function (done) {
      var schema = new Schema({
        Margin: {type: Number, field: 'bcd', bytes: 18, decimals: 4, extent: 'fix'}
      });

      expect(schema.fields[0]).to.include({
        wireFormat: 'Bcd'
      });

      var spec = schema.fields[0].toQvxSpec();
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

    it('should have Int64BE', function (done) {
      var schema = new Schema({
        ItemNumber: {type: Number, field: 'signed', bytes: 8, decimals: 0, endian: 'big'}
      });

      expect(schema.fields[0]).to.have.property('wireFormat', 'Int64BE');

      var spec = schema.fields[0].toQvxSpec();
      expect(spec).to.include({
        FieldName: 'ItemNumber',
        Type: 'QVX_SIGNED_INTEGER',
        Extent: 'QVX_FIX',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: true,
        CodePage: 65000,
        ByteWidth: 8,
        FixPointDecimals: 0
      });
      done();
    });


    it('should have Float', function (done) {
      var schema = new Schema({
        AddressNumber: {type: Number, bytes: 4, endian: 'big'}
      });

      expect(schema.fields[0]).to.be.instanceof(qvx.Schema.Types.Number)
      .to.include({
        type: 'Number',
        wireFormat: 'FloatBE'
      });

      var addrSpec = schema.fields[0].toQvxSpec();
      expect(addrSpec).to.include({
        FieldName: 'AddressNumber',
        Type: 'QVX_IEEE_REAL',
        Extent: 'QVX_FIX',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: true,
        CodePage: 65000,
        ByteWidth: 4
      });
      done();
    });

  });




  describe('fromQvx', function () {

    it('should suppor test_expressor', function (done) {
      var e = require('./fixtures/test_expressor_header.json');
      var schema = Schema.fromQvx(e);

      var margin = schema.fields[15];
      expect(margin).to.deep.include({
        name: 'Margin',
        field: 'bcd',
        decimals: 4,
        bytes: 18,
        endian: 'little',
        extent: 'fix',
        whenNull: 'supress',
        encoding: 'utf-8'
      });


      var itemDesc = schema.fields[7];
      expect(itemDesc).to.deep.include({
        name: 'ItemDesc',
        field: 'text',
        bytes: 4,
        endian: 'little',
        extent: 'counted',
        whenNull: 'supress',
        encoding: 'utf-8'
      });

      expect(itemDesc).to.be.instanceof(qvx.Schema.Types.String);
      expect(itemDesc).to.have.property('type', 'String');


      var invoiceDate = schema.fields[2];
      expect(invoiceDate).to.include({
        name: 'InvoiceDate',
        field: 'text',
        bytes: 1,
        endian: 'little',
        extent: 'counted',
        whenNull: 'supress',
        encoding: 'utf-8'
      })
      .to.have.property('format')
      .to.include({
        fmt: 'YYYY-MM-DD HH:mm:ss',
        type: 'TIMESTAMP'
      });

      expect(schema.fields).to.have.length(19);
      //console.log('asdf %j', schema);
      done();
    });

    it('DUAL', function (done) {
      var lc = {
        FieldName: 'LocalCurrency',
        Type: 'QVX_QV_DUAL',
        Extent: 'QVX_QV_SPECIAL',
        NullRepresentation: 'QVX_NULL_NEVER',
        BigEndian: false,
        CodePage: 65001,
        ByteWidth: 0,
        FixPointDecimals: 0,
        FieldFormat: {
          Type: 'UNKNOWN',
          Fmt: '',
          nDec: 0,
          UseThou: 0,
          Dec: '',
          Thou: ''
        }
      };

      var schema = Schema.fromQvx({
        QvxTableHeader: {
          Fields: {
            QvxFieldHeader: [lc]
          }
        }
      });

      expect(schema.fields).to.have.length(1);
      expect(schema.fields[0].toQvxSpec()).to.deep.eql(lc);
      done();
    });

  });
});
