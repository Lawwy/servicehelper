var nats = require('nats');
var client = null; //nats client
var _ = require('underscore');
module.exports = wrapNats;
/*
[{
  sub:'',
  pub:'',
  handler:fn
}]
*/
function wrapNats(opts, queues) {
  var url = opts.url
    || ((opts.protocol || 'nats') + '://' + opts.address + ':' + opts.port);
  client = nats.connect(url);
  setQueues(queues);
  return client;
}

function setQueues(queues) {
  queues.forEach(q => {
    client.subscribe(q.sub, wrapFn(q.handler, q.pub))
  })
}

function wrapFn(fn, pub) {
  return function(msg, reply) {
    if (_.isString(msg)) {
      msg = JSON.parse(msg);
    }
    fn(msg, function(err, output) {
      var result = {};
      if (err) {
        result.success = false;
        result.message = err.message;
      } else {
        result = _.isObject(output) ? output : {
          result: output
        };
        result.success = true;
      }
      if (reply) {
        client.publish(reply, JSON.stringify(result));
      }
      if (pub) {
        client.publish(pub, JSON.stringify(result));
      }
    })
  }
}
