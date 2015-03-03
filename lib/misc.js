
function utcNow () {
  return formatDate(new Date());
}

function formatDate (d) {
  if(typeof d === 'string') {
    return d;
  }
  var s = d.toISOString();
  return s.substr(0, s.indexOf('.')).replace('T', ' ');
}


function fromQvxDateFormat(fmt) {
  fmt = rAll(fmt, 'f', 'S');
  fmt = rAll(fmt, 'h', 'H');
  return fmt;
}

function toQvxDateFormat(fmt) {
  fmt = rAll(fmt, 'S', 'f');
  fmt = rAll(fmt, 'H', 'h');
  return fmt;
}


function rAll(text, search, replace) {
  return text.split(search).join(replace);
}

module.exports = {
    utcNow: utcNow,
    formatDate: formatDate,
    fromQvxDateFormat: fromQvxDateFormat,
    toQvxDateFormat: toQvxDateFormat
};
