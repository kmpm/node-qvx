var qvx = require('../');
var QvxField = qvx.QvxField;
var DataTypes = QvxField.DataTypes;

exports.createWriter = function () {
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
  });
  return writer;
};

