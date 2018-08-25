var debug = require('debug')('wf:apiFace');
var base = require('./face');
var util = require('util');
var _ = require('underscore');
var sh = require('./servicehelper.js');
var expWraper = require('./expWraper');
var async = require('async');

module.exports = ApiFace;

function ApiFace(opt) {
  this.routes = {};
  this.services = [];
}

util.inherits(ApiFace, base);

var proto = ApiFace.prototype;

proto.bind = function(cmd, handler, opt) {
  var self = this;
  if (!cmd || !_.isFunction(handler)) {
    return false;
  }
  opt = opt || {};
  var method = opt.method || 'POST';
  var path = self.makePath(cmd);
  self.routes[path] = {
    route: path,
    method: method.toLocaleUpperCase(),
    cmd: cmd,
    handler: handler
  }
  return true;
}

proto.do = function(opt, cb) {
  var self = this;
  cb = cb || finalHandler;
  if (!opt || !opt.port) {
    return cb(new Error("No Port Specify"));
  }
  var routeArr = _.values(self.routes);
  if (!routeArr.length) {
    return cb(new Error('No Routes'));
  }
  var app = expWraper(routeArr);
  var server = app.listen(opt.port, function(err) {
    if (err) {
      server.close();
      return cb(err);
    }
    self.services = makeServices(opt, routeArr);
    async.each(self.services, sh.register, function(err) {
      if (err) {
        server.close();
        self.deregisterAll(cb);
      } else {
        return cb(null, app);
      }
    });
  });
};

proto.makePath = function(cmd) {
  return '/' + cmd;
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
  url.protocol = 'http';
  return rs.map(r => makeServOpts(url, r));
}

function makeServOpts(url, r) {
  return {
    name: 'api.' + r.cmd,
    address: url.address,
    port: url.port,
    tags: ['protocol', url.protocol, 'path', r.route]
  }
}

function finalHandler(err, result) {
  if (err) {
    console.log(err);
  }
}
