/**
 * servicehelper
 * @module servicehelper
 * @example
 * //server.js
 * var Communicator = require('./servicehelper').Communicator;
 * var commu = new Communicator();
 * commu.add('sum',function(msg,done){...});
 * commu.start({ type:'http', port:3333}); //以http方式启动
 * commu.start({type:'queue',mq_service:'queue_service'});//以消息队列方式启动
 * ...
 * //client.js
 * var Client = require('./servicehelper').Client;
 * var param = {...}
 * Client.act('api.sum',param,function(e,result){...});//以http方式执行
 * Client.act('queue.sum',param,function(e,result){...});//以消息队列方式执行
 */
module.exports = {
  Communicator: require('./communicator'),
  Client: require('./client'),
  Common: require('./servicehelper')
}
