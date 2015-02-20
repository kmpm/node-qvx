var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var debug = require('debug')('qvx:test:field');


var Field = require('../lib/field');
var DataTypes = require('../lib/datatypes');

// lab.experiment('Field', function () {

//   lab.test('new clean instance', function (done) {
//     var f = new Field();
//     expect(f).to.include(['type', 'name']);
//     done();
//   });
// });

var fieldTest = {
  QVX_IEEE_REAL: function (f) {
    expect(f).to.deep.include({
      name: f.name,
      type: Number,
      storageFormat: 'decimal',
      size : 'DoubleLE'
    });
  },
  QVX_SIGNED_INTEGER: function (f) {
    expect(f).to.deep.include({
      name: f.name,
      type: Number,
      size: 'Int64LE'
    });
  },
  QVX_PACKED_BCD: function (f) {
    expect(f).to.deep.include({
      name: f.name,
      type: Number,
      storageFormat: 'bcd'
    });
  },
  QVX_TEXT: function (f) {
    if (f.type === DataTypes.Timestamp) {
      debug('date: %j', f);
      expect(f).to.deep.include({
        name: f.name,
        encoding: 'utf-8',
        bigEndian: false,
        type: DataTypes.Timestamp,
        dateFormat: 'YYYY-MM-DD hh:mm:ss.fff',
      });
      expect(f.size).to.be.a('function');
    }
    else {
      expect(f).to.deep.include({
        name: f.name,
        type: String,
      });
    }
  }
}

lab.describe('Field from qvx', function () {
  lab.test('fromQvx', function (done) {
    var qvxHeader = require('./fixtures/test_expressor_header.json');

    qvxHeader.QvxTableHeader.Fields.QvxFieldHeader.forEach(function (qvxdef) {
      var f = Field.fromQvx(qvxdef);
      debug(qvxdef.FieldName);
      expect(f).to.be.instanceof(Field);
      expect(f.name).to.equal(qvxdef.FieldName);
      expect(fieldTest[qvxdef.Type], qvxdef.Type).to.be.a('function');
      try {
        fieldTest[qvxdef.Type].bind(this)(f);
      }
      catch(err) {
        done(err);
      }
    });

    done();
  });

  lab.test('qvx double', function (done) {
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
    expect(f.size).to.equal('DoubleLE');
    done();
  });


  lab.test('qvx date counted', function (done) {
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
    expect(f.size).to.be.a('function');
    done();
  });

  lab.test('qvx dual', function (done) {
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
    expect(f.type).to.be.a('function');
    expect(f.type).to.eql(DataTypes.Dual);
    expect(f.nullHandler).to.equal('never');
    done();
  });//--qvx dual
});

