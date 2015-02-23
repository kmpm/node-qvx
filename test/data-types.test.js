var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var debug = require('debug')('qvx:test:data-types');

var describe = lab.experiment;
var it = lab.test;


var DataTypes = require('../lib/data-types');

describe('DataTypes', function () {

  it('::STRING()', function (done) {
    var s = DataTypes.STRING();
    expect(s).to.have.property('key', 'STRING');
    expect(s).to.have.property('_encoding', 'utf-8');
    expect(s).to.have.property('_countedEndian', undefined);
    expect(s).to.not.have.property('sizeType');
    // expect(s.sizeType).to.have.property('key', 'INTEGER');
    // expect(s.sizeType).to.have.property()
    done();
  });

  it('::STRING("utf-16", 2, "BE")', function (done) {
    var s = DataTypes.STRING('utf-16', 16, 'BE');
    expect(s).to.have.property('key', 'STRING');
    expect(s).to.have.property('_encoding', 'utf-16');
    expect(s).to.have.property('_countedEndian', 'BE');
    expect(s).to.have.property('sizeType');
    expect(s.sizeType).to.have.property('key', 'INTEGER');
    expect(s.sizeType).to.have.property('_length', 16);
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
});