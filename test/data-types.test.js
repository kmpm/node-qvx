var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var debug = require('debug')('qvx:test:data-types');

var describe = lab.experiment;
var it = lab.test;


var DataTypes = require('../lib/data-types');

describe('DataTypes', function () {

  it('::FLOAT({length: 8})', function (done) {
    var f = DataTypes.FLOAT(8);
    expect(f).to.have.property('wireFormat', 'DoubleLE');
    var spec = f.toQvxSpec();
    expect(spec).to.have.property('ByteWidth', 8);
    done();
  });


  it('::INTEGER({length: 2, _bigEndian: true})', function (done) {
    var i = DataTypes.INTEGER(2, true).UNSIGNED;
    expect(i).to.have.property('wireFormat', 'UInt16BE');
    expect(i).to.not.have.property('FixPointDecimals');
    done();
  });


  it('::BIGINT().DECIMALS(0)', function (done) {
    var bi = DataTypes.BIGINT().DECIMALS(0);
    expect(bi).to.have.property('_decimals', 0);
    expect(bi.options).to.have.property('decimals', 0);
    var spec = bi.toQvxSpec();
    expect(spec).to.have.property('FixPointDecimals', 0);
    done();
  })

  it('::STRING()', function (done) {
    var s = DataTypes.STRING('utf-8', 4);
    expect(s).to.have.property('key', 'STRING');
    expect(s).to.have.property('_encoding', 'utf-8');
    expect(s).to.have.property('_bigEndian', false);
    // expect(s).to.have.property('_counted', false);
    // expect(s).to.not.have.property('sizeType');
    // expect(s.sizeType).to.have.property('key', 'INTEGER');
    // expect(s.sizeType).to.have.property()
    done();
  });

  it('::STRING("utf-16", 2, true, true)', function (done) {
    var s = DataTypes.STRING('utf-16', 2, true, true);
    expect(s).to.have.property('key', 'STRING');
    expect(s).to.have.property('_encoding', 'utf-16');
    // expect(s).to.have.property('_bigEndian', true);
    // expect(s).to.have.property('_counted', true);
    // expect(s).to.have.property('_sizeType');
    // expect(s._sizeType).to.have.property('key', 'INTEGER');
    // expect(s._sizeType).to.have.property('wireFormat', 'UInt16BE');
    // expect(s._sizeType).to.have.property('_length', 2);
    // expect(s._sizeType).to.have.property('_bigEndian', true);
    done();
  });


  it('::FLOAT', function (done) {
    var t = DataTypes.FLOAT();
    expect(t.key).to.equal('FLOAT');
    done();
  });

  it('::TIMESTAMP', function (done) {
    var t = DataTypes.TIMESTAMP();
    expect(t.key).to.equal('TIMESTAMP');
    done();
  });

  it('::BCD(18)', function (done) {
    var t = DataTypes.BCD(18);
    expect(t.key).to.equal('BCD');
    var spec = t.toQvxSpec();
    expect(spec).to.have.property('Type', 'QVX_PACKED_BCD');
    expect(spec).to.have.property('ByteWidth', 18);
    done();
  });

});