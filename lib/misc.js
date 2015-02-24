
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
  return fmt.replace('.fff', '').replace('hh:', 'HH:');
}

function toQvxDateFormat(fmt) {
  return fmt.replace('HH:', 'hh:');
}


module.exports = {
    utcNow: utcNow,
    formatDate: formatDate,
    fromQvxDateFormat: fromQvxDateFormat,
    toQvxDateFormat: toQvxDateFormat
};