var consul = require('consul')({
  promisify: true
});
var _ = require('underscore');
var tool = require('./tool.js');
var os = require('os');

module.exports = {
  getService: getService,
  register: register,
  deregister: deregister,
  client: consul,
  getIP: getIP
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

function getService(name, cb) {
  consul.catalog.service.nodes(name, function(err, nodes) {
    if (err) {
      return cb(err);
    }
    if (!nodes || !nodes.length) {
      return cb(null, null);
    }
    var service = select(nodes);
    var result = parse(service);
    return cb(null, result);
  })
}

function parse(service) {
  return {
    name: service.ServiceName,
    address: service.ServiceAddress || service.Address,
    port: service.ServicePort,
    protocol: tool.getProtocol(service.ServiceTags),
    tags: service.ServiceTags
  }
}

function select(services) {
  if (_.isArray(services)) {
    return services[tool.randomInt(0, services.length - 1)];
  } else {
    return services;
  }
}

function register(option, cb) {
  return consul.agent.service.register(option, cb);
}

function deregister(option, cb) {
  return consul.agent.service.deregister(option, cb);
}

function getIP() {
  var network = os.networkInterfaces();
  for (var i = 0; i < network.en1.length; i++) {
    var json = network.en1[i];
    if (json.family == 'IPv4') {
      return json.address;
    }
  }
}
