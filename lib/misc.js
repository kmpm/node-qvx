

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


module.exports = {
    utcNow: utcNow,
    formatDate: formatDate
};
