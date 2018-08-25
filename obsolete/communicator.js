module.exports = Communicator;

var debug = require('debug')('wf:commu');
var expWraper = require('./expWraper');
var natsWraper = require('./natsWraper');
var _ = require('underscore');
var sh = require('./servicehelper');
var async = require('async');


function Communicator() {
  this.cmds = {};
  this.routes = {};
  this.queues = {};
}

var proto = Communicator.prototype;


/*
opt:
{
  type:'',
  port:'',//http服务端口号
  mq_service:'' //队列服务名
}
*/

//QUESTION:需要支持引用第三方库吗？
//TODO:opt参数设计
proto.add = function(cmd, fn) {
  var self = this;
  if (!_.isString(cmd) || !_.isFunction(fn) || !fn.length == 2) {
    return false;
  }
  self.cmds[cmd] = fn;
  //待定格式
  self.bindRoute('/' + cmd, cmd);
  self.bindQueue('queue.' + cmd, cmd);
  return true;
}

proto.start = function(opt, cb) {
  var self = this;
  cb = _.isFunction(cb) ? cb : finalHandler;
  if (!opt) {
    return cb(new Error('no options input'));
  }
  switch (opt.type) {
    case 'http':
      return self.doHttp(opt, cb);
    case 'queue':
      return self.doQueue(opt, cb);
    default:
      return self.doHttp(opt, cb);
  }
}

proto.doHttp = function(opt, cb) {
  var self = this;
  var routeArr = getRoutes.call(self);
  if (!routeArr.length || !opt.port) {
    return cb(new Error('no routes or no port'));
  }
  var app = expWraper(routeArr);
  var server = app.listen(opt.port, function(err) {
    if (err) {
      server.close();
      return cb(err);
    }
    registerAllRcmd(opt, routeArr, function(err) {
      if (err) {
        server.close();
        return cb(err);
      } else {
        return cb.apply(null, arguments)
      }
    });
  });
}

proto.doQueue = function(opt, cb) {
  var self = this;
  var queueArr = getQueues.call(self);
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
    registerAllQcmd(service, queueArr, function(err) {
      if (err) {
        qs.close();
        return cb(err);
      } else {
        return cb.apply(null, arguments);
      }
    });
  })
}

proto.bindRoute = function(path, cmd, method) {
  var self = this;
  if (!path || !cmd || !self.cmds[cmd]) {
    return false;
  }
  method = method || 'POST';
  self.routes[path] = {
    method: method.toLocaleUpperCase(),
    cmd: cmd
  }
  return true;
}

proto.bindQueue = function(subQ, cmd, pubQ) {
  var self = this;
  if (!subQ || !cmd || !self.cmds[cmd]) {
    return false;
  }
  self.queues[subQ] = {
    cmd: cmd,
    pub: pubQ || ''
  }
  return true;
}

// proto.act = function(cmd, msg, cb) {
//   var self = this;
//   var handler = self.cmds[cmd];
//   if (!handler) {
//     return cb(new Error('No Such cmd:' + cmd));
//   }
//   cb = cb || finalHandler;
//   handler(msg, cb);
// }


//注册队列命令
function registerQcmd(url, q, cb) {
  var name = 'queue.' + q.cmd;
  var servOpt = {
    name: 'queue.' + q.cmd,
    address: url.address,
    port: url.port,
    tags: ['protocol', url.protocol, 'path', name]
  }
  sh.register(servOpt, cb);
}

function registerAllQcmd(url, qs, callback) {
  url.address = url.address || sh.getIP();
  url.protocol = url.protocol || 'nats';
  function fn(q, cb) {
    return registerQcmd(url, q, cb);
  }
  async.each(qs, fn, callback);
}

//注册路由命令
function registerRcmd(url, r, cb) {
  var name = 'api.' + r.cmd;
  var servOpt = {
    name: 'api.' + r.cmd,
    address: url.address,
    port: url.port,
    tags: ['protocol', url.protocol, 'path', '/' + r.cmd]
  }
  sh.register(servOpt, cb);
}

function registerAllRcmd(url, rs, callback) {
  url.address = url.address || sh.getIP();
  url.protocol = url.protocol || 'http';
  function fn(r, cb) {
    return registerRcmd(url, r, cb);
  }
  async.each(rs, fn, callback);
}

function getRoutes() {
  var self = this;
  var ks = _.keys(self.routes);
  var routeArr = [];
  _.each(ks, function(key) {
    var route = self.routes[key];
    routeArr.push({
      route: key,
      method: route.method,
      handler: self.cmds[route.cmd],
      cmd: route.cmd
    })
  })
  return routeArr;
}

function getQueues() {
  var self = this;
  var ks = _.keys(self.queues);
  var queueArr = [];
  _.each(ks, function(key) {
    var queue = self.queues[key];
    queueArr.push({
      sub: key,
      pub: queue.pub,
      handler: self.cmds[queue.cmd],
      cmd: queue.cmd
    })
  })
  return queueArr;
}

function finalHandler(err, result) {
  debug(err, result);
}
