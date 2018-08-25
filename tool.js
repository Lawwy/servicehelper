// var urlHelper = require('url');
var _ = require('underscore');

module.exports = {
  randomInt: randomInt,
  parseAddress: parseAddress,
  getProtocol: getProtocol
}

function randomInt(minNum, maxNum) {
  if (!_.isNumber(minNum) || !_.isNumber(maxNum)) {
    return NaN;
  }
  return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
}

/*
{ Node: 'xurumiaodeMini.lan',
    Address: '192.168.67.241',
    TaggedAddresses: { lan: '192.168.67.241', wan: '192.168.67.241' },
    ServiceID: 'RunnerManager',
    ServiceName: 'RunnerManager',
    ServiceTags: [],
    ServiceAddress: '192.168.67.241',
    ServicePort: 3003,
    ServiceEnableTagOverride: false,
    CreateIndex: 20,
    ModifyIndex: 20 }
*/
function parseAddress(service) {
  if (!service || !service.ServiceAddress) {
    return '';
  }
  var protocol = getProtocol(service.ServiceTags) || 'http';
  var result = (protocol ? protocol + '://' : '')
  + service.ServiceAddress
  + (service.ServicePort ? ':' + service.ServicePort : '');
  return result;
}

//暂时约定tags中"protocol"后的标签值为协议类型
function getProtocol(tags) {
  if (!tags) {
    return '';
  }
  var _index = _.indexOf(tags, 'protocol');
  if (_index > -1) {
    return tags[_index + 1] || '';
  }
  return '';
}
