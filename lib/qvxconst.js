

exports.extent = {
  fix: 'QVX_FIX',
  counted: 'QVX_COUNTED',
  zero: 'QVX_ZERO_TERMINATED',
  special: 'QVX_QV_SPECIAL'
};

exports.nullRepresentation = {
  supress: 'QVX_NULL_FLAG_SUPPRESS_DATA',
  none: 'QVX_NULL_NEVER'
}

exports.typeName = {
  text: 'QVX_TEXT',
  float: 'QVX_IEEE_REAL',
  signed: 'QVX_SIGNED_INTEGER',
  bcd: 'QVX_PACKED_BCD'
};

exports.qvxToField = {
  QVX_TEXT: 'text',
  QVX_IEEE_REAL: 'float',
  QVX_PACKED_BCD: 'bcd',
  QVX_SIGNED_INTEGER: 'signed'
};

exports.qvxToType = {
  QVX_TEXT: String,
  QVX_IEEE_REAL: Number,
  QVX_PACKED_BCD: Number,
  QVX_SIGNED_INTEGER: Number
};
