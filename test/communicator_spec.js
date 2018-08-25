var Communicator = require('../communicator.js');
var expect = require('chai').expect;
var client = require('../client');
var cp = require('child_process');
var sh = require('../servicehelper');

describe('#basic', function() {
  var commu;
  var sp;
  var qp;
  before(function(done) {
    commu = new Communicator();
    setupEnv(function(e, ps) {
      sp = ps.sp;
      qp = ps.qp;
      done();
    })
  })

  after(function() {
    if (sp) {
      sp.kill();
    }
    if (qp) {
      qp.kill();
    }
  })

  it('#new', function() {
    expect(commu).instanceof(Communicator);
    expect(commu).to.have.property("add");
    expect(commu).to.have.property("start");
  });

  it('#add()', function() {
    commu.add('sum', function sumFn(msg, done) {
      var num1 = msg.num1;
      var num2 = msg.num2;
      if (typeof num1 != 'number' || typeof num2 != 'number') {
        return done(new Error('wrong input'));
      }
      var result = {};
      result.sum = num1 + num2;
      return done(null, result);
    })
    expect(commu.cmds['sum'].name).to.equal("sumFn");
  });

  describe('#http', function() {
    describe('#start():http', function() {
      before(function() {
        commu.start({
          type: 'http',
          port: 3333
        })
      })
      it('#request:success', function(done) {
        var msg = {
          num1: 1,
          num2: 2
        }
        client.act("api.sum", msg, function(err, result) {
          expect(result.success).to.equal(true);
          expect(result.sum).to.equal(3);
          done();
        })
      });
      it('#request:fail', function(done) {
        var badMsg = {
          num1: 'ddd',
          num2: 'eee'
        }
        //TODO:返回什么好
        client.act('api.sum', badMsg, function(e, r) {
          expect(r.success).to.equal(false);
          expect(r.message).to.equal('wrong input');
          done();
        })
      });
    });
  });

  describe('#queue', function() {
    describe('#start():queue', function() {
      var address;
      before(function() {
        commu.start({
          type: 'queue',
          mq_service: 'queue_service'
        });
      })

      //QUESTION:需加这段才通过测试，进程没有启动完全？
      beforeEach(function(done) {
        setTimeout(function() {
          done();
        }, 1000);
      })

      it('#request msg:success', function(done) {
        var msg = {
          num1: 1,
          num2: 2
        }
        client.act('queue.sum', msg, function(err, result) {
          expect(result.success).to.equal(true);
          expect(result.sum).to.equal(3);
          done();
        })
      })

      it('#request msg:fail', function(done) {
        var badMsg = {
          num1: 'hel',
          num2: 'dd'
        }
        client.act('queue.sum', badMsg, function(e, r) {
          expect(r.success).to.equal(false);
          expect(r.message).to.equal('wrong input');
          done();
        })
      })
    })
  });
});

function setupEnv(cb) {
  var ps = {};
  setupConsul(function(err, sp) {
    if (err) {
      return cb(err)
    }
    ps.sp = sp;
    setupQueue(function(err, qp) {
      console.log(err);
      if (err) {
        ps.sp.kill();
        if (qp) {
          qp.kill();
        }
        return cb(err);
      }
      ps.qp = qp;
      return cb(null, ps);
    })
  })
}

function setupQueue(cb) {
  var cmd = 'gnatsd';
  var args = ["-p", "4333"];
  var p = setup(cmd, args);
  p.stderr.on('data', function(chunk) {
    if (chunk.toString().indexOf("Server is ready") > -1) {
      var servOpt = {
        name: 'queue_service',
        port: 4333,
        tags: ['protocol', 'nats']
      }
      sh.register(servOpt, function(err) {
        return cb(err, p);
      });
    }
  })
}

function setupConsul(cb) {
  var cmd = 'consul';
  var args = ["agent", "-dev", "-bootstrap"];
  var p = setup(cmd, args);
  p.stdout.on('data', function(chunk) {
    if (chunk.toString().indexOf("Synced service 'consul'") > -1) {
      return cb(null, p);
    }
  })
}

function setup(cmd, args, options) {
  args = args || [];
  var proc = cp.spawn(cmd, args);
  return proc;
}
