var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.describe;
var it = lab.test;
var debug = require('debug')('qvx:test:field');

var qvx = require('..');

var Cursor = require('../lib/extended-cursor');

var Field = qvx.Field;
var DataTypes = qvx.DataTypes;

describe('Fields', function () {

  describe('::fromQvx()', function () {

    it('BIGINT', function (done) {
      var inbound = {
        'FieldName': 'ItemNumber',
        'Type': 'QVX_SIGNED_INTEGER',
        'Extent': 'QVX_FIX',
        'NullRepresentation': 'QVX_NULL_FLAG_SUPPRESS_DATA',
        'BigEndian': 'false',
        'CodePage': '65001',
        'ByteWidth': '8',
        'FixPointDecimals': '0'
      };
      var f = Field.fromQvx(inbound);
      expect(f.type.key).to.equal('BIGINT');
      expect(f.type.wireFormat).to.equal('Int64LE');
      done();
    });


    it('DOUBLE', function (done) {
      var inbound = {
        'FieldName': 'AddressNumber',
        'Type': 'QVX_IEEE_REAL',
        'Extent': 'QVX_FIX',
        'NullRepresentation': 'QVX_NULL_FLAG_SUPPRESS_DATA',
        'BigEndian': 'false',
        'CodePage': '65001',
        'ByteWidth': '8'
      };
      var f = Field.fromQvx(inbound);
      expect(f.type.key).to.equal('FLOAT');
      expect(f.type.wireFormat).to.equal('DoubleLE');
      done();
    });


    it('DUAL', function (done) {
      var inbound = {
        FieldName: 'LocalCurrency',
        Type: 'QVX_QV_DUAL',
        Extend: 'QVX_QV_SPECIAL',
        NullRepresentation: 'QVX_NULL_NEVER',
        LittleEndian: 'false',
        CodePage: '650001',
        ByteWidth: '0',
        FixPointDecimals: '0',
        FieldFormat: {
          Type:'UNKNOWN',
          nDec: '0',
          UseThou: '0'
        },
        BigEndian: 'false',
      };

      var f = Field.fromQvx(inbound);
      expect(f.type.key).to.equal('DUAL');
      expect(f.nullHandler).to.equal('none');
      expect(f.type.wireFormat).to.equal('Dual');
      done();
    });//--DUAL


    it('STRING', function (done) {
      var inbound = {
        "FieldName": "ItemDesc",
        "Type": "QVX_TEXT",
        "Extent": "QVX_COUNTED",
        "NullRepresentation": "QVX_NULL_FLAG_SUPPRESS_DATA",
        "BigEndian": "false",
        "CodePage": "65001",
        "ByteWidth": "4"
      };
      var f = Field.fromQvx(inbound);
      var t = f.type;
      expect(f).to.have.property('name', 'ItemDesc')
      expect(t).to.have.property('key', 'STRING');
      expect(t).to.have.property('_extent', 'counted');
      var spec = t.toQvxSpec();
      expect(spec).to.have.property('ByteWidth', 4);
      expect(spec).to.have.property('BigEndian', false);
      expect(spec).to.have.property('CodePage', 65001);
      expect(spec).to.have.property('Extent', 'QVX_COUNTED');

      done();
    });

    it('TIMESTAMP', function (done) {
      var inbound = {
        'FieldName': 'InvoiceDate',
        'Type': 'QVX_TEXT',
        'Extent': 'QVX_COUNTED',
        'NullRepresentation': 'QVX_NULL_FLAG_SUPPRESS_DATA',
        'BigEndian': 'false',
        'CodePage': '65001',
        'ByteWidth': '1',
        'FieldFormat': {
          'Type': 'TIMESTAMP',
          'Fmt': 'YYYY-MM-DD hh:mm:ss.fff'
        }
      };
      var f = Field.fromQvx(inbound);

      var t = f.type;

      expect(t).to.be.instanceof(DataTypes.TIMESTAMP);
      expect(t).to.have.property('key', 'TIMESTAMP');
      expect(t).to.have.property('wireFormat', 'Date');
      expect(t).to.have.property('_extent', 'counted');

      var buf = new Buffer(24);
      buf.writeUInt8(23, 0);
      buf.write('2015-02-22 19:48:10.001', 1, 23, 'utf-8');
      var cursor = new Cursor(buf);
      var v = t.read(cursor);

      expect(v).to.be.instanceof(Date);
      var expected = new Date(2015, 1, 22, 19, 48, 10, 1);
      expect(v).to.deep.equal(expected);

      done();
    });

  });//--fromQvx
});

