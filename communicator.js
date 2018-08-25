module.exports = Communicator;

var debug = require('debug')('wf:commu');
var ApiFace = require('./apiFace');
var QueueFace = require('./queueFace');
var _ = require('underscore');
// var sh = require('./servicehelper');
var async = require('async');

/**
 * @class 
 * @classdesc 帮助对外发布服务，如http api,message queue服务。
 * @memberof module:servicehelper
 */
function Communicator() {
  this.cmds = {};
  this.api = new ApiFace();
  this.queue = new QueueFace();
}


/**
 * 添加命令,绑定命令到某方法
 * @param  {string} cmd 命令名称
 * @param  {function} fn 命令所执行函数,形如function(msg,done){return done(e,result)}
 * @return {bool} 添加成功或失败
 * @example
 * var commu = new Communicator();
 * commu.add('sum',function(msg,done){
 *  var num1 = msg.num1;
 *  var num2 = msg.num2;
 *  if(typeof num1 !=='number'||typeof num2 !=='number'){
 *    return done(new Error('invalid input'));
 *  }
 *  return done(null,num1+num2);
 *})
 */
Communicator.prototype.add = function(cmd, fn) {
  var self = this;
  if (!_.isString(cmd) || !_.isFunction(fn) || !fn.length == 2) {
    return false;
  }
  self.cmds[cmd] = fn;
  //待定格式
  self.api.bind(cmd, fn);
  self.queue.bind(cmd, fn);
  return true;
}


/**
 * 启动，对外发布服务
 * 可以不同服务类型启动多次
 * @param  {Object} opt 启动参数
 * @param  {function} cb 回调,形如function(err){}
 * @example
 * {
 *  type:'http', //or 'queue'
 *  port:3000, //端口号,type为'http'时需指定
 *  mq_service:'queue_service',//消息队列服务名,type为'queue'时需指定
 * }
 */
Communicator.prototype.start = function(opt, cb) {
  var self = this;
  cb = _.isFunction(cb) ? cb : finalHandler;
  if (!opt) {
    return cb(new Error('no options input'));
  }
  switch (opt.type) {
    case 'http':
      return self.api.do(opt, cb);
    case 'queue':
      return self.queue.do(opt, cb);
    default:
      return self.api.do(opt, cb);
  }
}

function finalHandler(err, result) {
  debug(err, result);
}
