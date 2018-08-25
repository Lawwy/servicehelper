var expect = require('chai').expect;
var connector = require('../index');
var Communicator = connector.Communicator;
var Client = connector.Client;
var Common = connector.Common;
var testTool = require('./tool/cp_starter.js');
var _ = require('underscore');

describe('#total', function() {
  var _ps = null;
  before(function(done) {
    setupEnv(function(err, ps) {
      _ps = ps;
      done();
    })
  })
  after(function() {
    tearUp(_ps);
  })

  describe('#Common function', function() {
    it('#register', function(done) {
      var service = {
        name: 'testService',
        address: '192.168.10.10',
        port: 3333
      }
      Common.register(service, function(err) {
        expect(err).to.not.exist;
        done();
      })
    })

    it('#getService exist', function(done) {
      Common.getService('testService', function(err, r) {
        expect(r).to.eql({
          name: 'testService',
          address: '192.168.10.10',
          port: 3333,
          protocol: '',
          tags: []
        });
        done();
      })
    })

    it('#getService not exist', function(done) {
      Common.getService('helloservies', function(err, r) {
        expect(r).to.equal(null);
        done();
      })
    })

    it('#deregister', function(done) {
      Common.deregister('testService', function(err) {
        expect(err).to.not.exist;
        done();
      })
    })
  })

  describe('#Communicator', function() {
    commu = null;
    before(function() {
      commu = new Communicator();
    })
    after(function() {
      commu.close();
    })
    it('#new', function() {
      var commu = new Communicator();
      expect(commu).instanceof(Communicator);
      expect(commu).to.have.property("add");
      expect(commu).to.have.property("start");
      commu = null;
    });
    it('#add', function() {
      commu.add('sum', function sumFn(msg, done) {
        return done(null, 'sum');
      })
      expect(commu.cmds['sum'].name).to.equal("sumFn");
    })
    it('#start', function(done) {
      var serviceName = 'sumService';
      commu.start({
        name: serviceName,
        api: {
          port: 3355
        }
      }, function(err) {
        Common.getService(serviceName, function(err, serv) {
          expect(serv.name).to.eql(serviceName);
          done();
        })
      })
    })
  })

  describe('#Client', function() {
    var commu;
    before(function(done) {
      commu = new Communicator();
      commu.add('sum', function(msg, done) {
        var num1 = msg.num1;
        var num2 = msg.num2;
        if (typeof num1 != 'number' || typeof num2 != 'number') {
          return done(new Error('wrong input'));
        }
        var result = {};
        result.sum = num1 + num2;
        return done(null, result);
      });
      commu.start({
        name: 'sumService',
        api: {
          port: 3355
        }
      }, function(err) {
        if (!err) {
          done();
        }
      })
    })

    after(function() {
      commu.close();
    })

    it('#act when input is valid', function(done) {
      var options = {
        service: 'sumService',
        fnName: 'sum',
        actType: 'sync'
      }
      var parameters = {
        num1: 1,
        num2: 2
      }
      client.act(options, parameters, function(err, result) {
        expect(result.success).to.eql(true);
        expect(result.sum).to.eql(3);
        done();
      })
    });

    it('#act when input is invalid', function(done) {
      var options = {
        service: 'sumService',
        fnName: 'sum',
        actType: 'sync'
      }
      var parameters = {
        num1: 'dss',
        num2: 'dde'
      }
      client.act(options, parameters, function(err, result) {
        expect(result.success).to.eql(false);
        done();
      })
    });

    it('#act when no service', function(done) {
      var options = {
        service: 'hello',
        fnName: 'hello',
        actType: 'sync'
      }
      client.act(options, {}, function(err, result) {
        expect(err).to.be.exist;
        expect(err.message).to.be.eql('no "hello" service exist');
        done();
      })
    })
  })

});

function setupEnv(cb) {
  var ps = {};
  testTool.setupConsul(function(err, sp) {
    if (err) {
      if (sp) {
        sp.kill();
      }
      return cb(err)
    }
    ps._cp_consul = sp;
    return cb(null, ps);
  })
}

function tearUp(ps) {
  var ks = _.keys(ps);
  ks.forEach(k => {
    ps[k].kill();
  })
}
