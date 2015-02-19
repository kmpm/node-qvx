var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('code').expect;


// var streams = require('memory-streams');
// var concat = require('concat-stream');

var fs = require('fs');
var path = require('path');

var qvx = require('../');

lab.experiment('Writer', function () {

  lab.test('#headerToXml', function (done) {
    var config = {
      'MajorVersion': '1',
      'MinorVersion': '0',
      'CreateUtcTime': '2012-03-06 19:22:15',
      'TableName': 'test',
      'UsesSeparatorByte': 'true',
      'Creator': {
        'Company': 'expressor',
        'Product': 'Studio.Extension.QlikView',
        'MajorVersion': '1',
        'MinorVersion': '0',
        'MaintenanceVersion': '0'
      }
    };
    var writer = new qvx.Writer(config);

    writer.generateFields({
      'AddressNumber': 10022755,
      'ItemNumber': 10821,
      'InvoiceDate': new Date(2010, 11, 20, 0, 0, 0),
      'PromisedDeliveryDate': new Date(2010, 11, 20, 0, 0, 0), //'2010-11-19T23:00:00.000Z',
      'Date': new Date(2010, 11, 20, 0, 0, 0), //'2010-11-19T23:00:00.000Z',
      'InvoiceNumber': null,
      'OrderNumber': 214657,
      'ItemDesc': 'Ebony Lemons',
      'SalesQty': 5.5,
      'OpenQty': 5.5,
      'OpenOrder': null,
      'GrossSales': null,
      'Sales': null,
      'BackOrder': 100.5,
      'Cost': 20.53,
      'Margin': null,
      'SalesKey': '11/01/2010_10022755_118',
      'ofDaysLate': null,
      'ofDaystoShip': null
    });

    var xml = writer.headerToXml();
    fs.writeFileSync('test.headerToXml.log', xml);
    done();
  });

});//--Writer
