var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('code').expect;

var describe = lab.experiment;
var it = lab.test;

var strint = require('../lib/strint');

describe('Sign handling', function () {
  it('negates', function(done) {
    expect(strint.negate('1')).to.equal('-1');
    done();
  });

  it('computes magnitude', function(done) {
    expect(strint.abs('-5')).to.equal('5');
    done();
  });

});
describe('Addition', function () {
  it('subtracts', function (done) {
    expect(strint.sub('9007199254740994', '1')).to.equal('9007199254740993');
    done();
  });

  it('adds', function (done) {
    expect(strint.add('-2', '-2')).to.equal('-4');
    expect(strint.add('2', '2')).to.equal('4');
    expect(strint.add('2', '-2')).to.equal('0');

    expect(strint.add('5', '-4')).to.equal('1');
    expect(strint.add('5', '-6')).to.equal('-1');

    expect(strint.add('-5', '4')).to.equal('-1');
    expect(strint.add('-5', '6')).to.equal('1');

    expect(strint.add('9007199254740992', '1')).to.equal('9007199254740993');
    done();
  });
});

describe('Multiplication', function () {
  it('multiplies with digit', function (done) {
    expect(strint.timesDigit('125', 3)).to.equal('375');
    expect(strint.timesDigit('1111111111111111111111', 3)).to.equal('3333333333333333333333');
    expect(strint.timesDigit('5', 5)).to.equal('25');
    expect(strint.timesDigit('9', 9)).to.equal('81');
    expect(strint.timesDigit('1234567', 0)).to.equal('0');
    done();
  });

  it('multiplies positive numbers', function (done) {
    expect(strint.mulPositive('123', '123')).to.equal(String(123 * 123));
    expect(strint.mulPositive('5', '5')).to.equal('25');
    done();
  });

  it('multiplies', function (done) {
    expect(strint.mul('-5', '5')).to.equal('-25');
    expect(strint.mul('5', '-5')).to.equal('-25');
    expect(strint.mul('5', '5')).to.equal('25');
    expect(strint.mul('-5', '-5')).to.equal('25');
    done();
  });
});


describe('Division', function () {
  it('divides non-negative integers with remainder', function (done) {
    expect(strint.quotientRemainderPositive('1500', '15')).to.deep.equal([ '100', '0' ]);
    expect(strint.quotientRemainderPositive('167', '15')).to.deep.equal([ '11', '2' ]);
    expect(strint.quotientRemainderPositive('225', '15')).to.deep.equal([ '15', '0' ]);
    expect(strint.quotientRemainderPositive('700', '15')).to.deep.equal([ '46', '10' ]);
    expect(strint.quotientRemainderPositive('290', '15')).to.deep.equal([ '19', '5' ]);
    done();
  });

  it('divides', function (done) {
    expect(strint.div('15', '3')).to.equal('5');
    expect(strint.div('-15', '-3')).to.equal('5');
    expect(strint.div('-15', '3')).to.equal('-5');
    expect(strint.div('15', '-3')).to.equal('-5');
    done();
  });
});


describe('Comparison operators', function () {

  it('compare equal', function (done) {
    expect(strint.eq('15', '225')).to.equal(false);
    done();
  });

  it('compare less than', function (done) {
    expect(strint.lt('0', '0')).to.equal(false);
    expect(strint.lt('2', '2')).to.equal(false);
    expect(strint.lt('-3', '-20')).to.equal(false);
    expect(strint.lt('-7', '-1')).to.equal(true);
    expect(strint.lt('2', '1999')).to.equal(true);
    done();
  });

  it('compare greater or equal', function (done) {
    expect(strint.ge('15', '225')).to.equal(false);
    done();
  });

  it('compare greater than', function (done) {
    expect(strint.gt('15', '225')).to.equal(false);
    done();
  });
});


describe('Helpers', function () {
  it('normalize', function (done) {
    expect(strint.normalize('0000')).to.equal('0');
    expect(strint.normalize('0')).to.equal('0');
    expect(strint.normalize('00123')).to.equal('123');
    expect(strint.normalize('123')).to.equal('123');
    expect(strint.normalize('-00123')).to.equal('-123');
    expect(strint.normalize('-123')).to.equal('-123');
    done();
  });
});
