var request = require('request');
var nats = require('nats');
var client = null;
var sh = require('./servicehelper');
var _ = require('underscore');

module.exports = new Commander();


/**
 * @class
 * @classdesc 帮助执行服务命令
 * @memberof module:servicehelper
 */
function Commander(opts) {
  // this.mq_service = opts.mq_service;
  // this.mq_url = '';
}

// var proto = Commander.prototype;


/**
 * 给定参数,执行命令
 * @param  {string} cmdExp 命令表达式,http服务格式为:'api.'+命令名称,消息队列服务格式为:'queue.'+命令名称
 * @param  {object} msg  命令执行参数
 * @param  {function} cb 命令执行结果回调,形如function(err,result){}
 * @example
 * var client = new Client();
 * var parameters = { num1:1, num2:2}
 * client.act('api.sum',parameters,function(err,result){
 *   console.log(err,result);
 * })
 */

Commander.prototype.act = function(cmdExp, msg, cb) {
  var self = this;
  var vs = cmdExp.split('.');
  var cmdType = vs[0];
  var cmd = vs[1];
  var servName = cmdExp;
  switch (cmdType) {
    case 'api':
      return self.actHttp(servName, msg, cb);
    case 'queue':
      return self.actMsgQueue(servName, msg, cb);
    default:
      return cb(new Error('invalid cmd expression'));
  }
}

Commander.prototype.actHttp = function(servName, msg, cb) {
  sh.getService(servName, function(err, service) {
    if (err) {
      return cb(err);
    }
    if (!service) {
      return cb(new Error('No ' + '"' + servName + '"' + ' Service'));
    }
    var path = getPath(service.tags);
    var url = (service.protocol || 'http') + '://' + service.address + ':' + service.port + path;
    request({
      method: 'POST',
      url: url,
      json: true,
      body: msg
    }, function(err, resp, body) {
      return cb(err, body);
    })
  })
}

Commander.prototype.actMsgQueue = function(servName, msg, cb) {
  sh.getService(servName, function(err, service) {
    if (err) {
      return cb(err);
    }
    if (!service) {
      return cb(new Error('No ' + '"' + servName + '"' + ' Service'));
    }
    var qName = getPath(service.tags);
    var mq_address = (service.protocol || 'nats') + '://' + service.address + ':' + service.port;
    try {
      client = nats.connect(mq_address);
      msg = JSON.stringify(msg);
      client.request(qName, msg, function(res) {
        var res = JSON.parse(res);
        return cb(null, res);
      })
    } catch (e) {
      return cb(e)
    }
  })
}

function getPath(tags) {
  var pre = _.findIndex(tags, function(tag) {
    return tag == 'path';
  });
  var path = tags[pre + 1];
  return path;
}
