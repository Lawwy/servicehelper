var sh = require('../servicehelper.js');
var expect = require('chai').expect;
var _ = require('underscore');
var async = require('async');
var cp = require('child_process');

describe('#servicehelper', function() {
  var _cp_consul = null;
  before(function(done) {
    setupEnv(function(e, p) {
      if (!e) {
        _cp_consul = p;
      }
      done();
    })
  })

  after(function(done) {
    if (_cp_consul) {
      _cp_consul.kill();
    }
    done();
  })

  describe('#unit 1', function() {
    it('#register', function(done) {
      var service = {
        name: 'testService',
        address: '192.168.10.10',
        port: 3333
      }
      sh.register(service, function(err) {
        expect(err).to.not.exist;
        done();
      })
    })

    it('#getService exist', function(done) {
      sh.getService('testService', function(err, r) {
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
      sh.getService('helloservies', function(err, r) {
        expect(r).to.equal(null);
        done();
      })
    })

    it('#deregister', function(done) {
      sh.deregister('testService', function(err) {
        expect(err).to.not.exist;
        done();
      })
    })
  })

// xdescribe('#getService by query', function() {
//   var services;
//   before(function(done) {
//     services = [{
//       name: 'downloadTest',
//       tags: ['download']
//     }, {
//       name: 'spiderTest',
//       tags: ['spider']
//     }, {
//       name: 'extractTest',
//       tags: ['extract']
//     }]
//     async.each(services, sh.register, function(err) {
//       done();
//     })
//   })
//
//   after(function(done) {
//     var names = services.map(s => s.name);
//     async.each(names, sh.deregister, function(err) {
//       done();
//     })
//   })
//
//   it('#query 1', function(done) {
//     var query = {
//       tags: ['download']
//     }
//     sh.getService(query, function(err, r) {
//       expect(r.name).to.eql('downloadTest');
//       expect(r.tags).to.eql(['download']);
//       done();
//     })
//   })
//
//   it('#query 2', function(done) {
//     var query = {
//       service: 'spiderTest'
//     }
//     sh.getService(query, function(err, r) {
//       expect(r.name).to.eql('spiderTest');
//       expect(r.tags).to.eql(['spider']);
//       done();
//     })
//   })
// })
});

function setupEnv(cb) {
  setupConsul(function(err, sp) {
    if (err) {
      return cb(err)
    }
    return cb(null, sp);
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
