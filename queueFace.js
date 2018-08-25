var debug = require('debug')('wf:queueFace');
var base = require('./face');
var util = require('util');
var _ = require('underscore');
var sh = require('./servicehelper.js');
var natsWraper = require('./natsWraper');
var async = require('async');

module.exports = QueueFace;

function QueueFace(opt) {
  this.queues = {};
  this.services = [];
}

util.inherits(QueueFace, base);

var proto = QueueFace.prototype;

proto.bind = function(cmd, handler, opt) {
  var self = this;
  if (!cmd || !_.isFunction(handler)) {
    return false;
  }
  opt = opt || {};
  var path = self.makePath(cmd);
  self.queues[path] = {
    sub: path,
    cmd: cmd,
    handler: handler,
    pub: opt.pub
  }
  return true;
}

proto.do = function(opt, cb) {
  var self = this;
  var queueArr = _.values(self.queues);
  cb = cb || finalHandler;
  if (!queueArr.length || !opt.mq_service) {
    return cb(new Error('no queues or no service name'));
  }
  sh.getService(opt.mq_service, function(err, service) {
    if (err) {
      return cb(err);
    }
    if (!service) {
      return cb(new Error('No ' + '"' + opt.mq_service + '"' + ' Service'));
    }
    var qs = natsWraper(service, queueArr);
    self.services = makeServices(service, queueArr);
    async.each(self.services, sh.register, function(err) {
      if (err) {
        qs.close();
        self.deregisterAll(cb);
      } else {
        return cb(null, qs);
      }
    });
  })
};

proto.makePath = function(cmd) {
  return 'queue.' + cmd;
}

proto.deregisterAll = function(cb) {
  var self = this;
  cb = cb || finalHandler;
  var servNames = self.services.map(s => s.name);
  async.each(servNames, sh.deregister, cb)
}

function makeServices(opt, rs) {
  var url = {};
  url.port = opt.port;
  url.address = opt.address;
  url.protocol = 'nats';
  return rs.map(r => makeServOpts(url, r));
}

function makeServOpts(url, r) {
  var name = 'queue.' + r.cmd;
  return {
    name: name,
    address: url.address,
    port: url.port,
    tags: ['protocol', url.protocol, 'path', name]
  }
}

function finalHandler(err, result) {
  if (err) {
    console.log(err);
  }
}
