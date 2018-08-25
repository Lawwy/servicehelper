// var rewire = require('rewire');
var tools = require('../tool.js');
var expect = require('chai').expect;
var _ = require('underscore');

describe('#tool func', function() {
  describe('#randomInt', function() {
    it('#randomInt single', function() {
      var num = tools.randomInt(0, 3);
      expect(num).to.be.a('number');
      expect(num).to.be.within(0, 3);
    });
    it('#randomInt many', function() {
      for (let i = 0; i < 1000; i++) {
        expect(tools.randomInt(0, 3)).to.be.within(0, 3);
      }
    });
    it('#randomInt chance', function() {
      let times = {};
      for (let i = 0; i < 10000; i++) {
        var num = tools.randomInt(0, 3);
        times[num] = _.isUndefined(times[num]) ? 0 : times[num];
        times[num]++;
      }
      expect(times[0] / 10000).to.be.closeTo(0.25, 0.01);
      expect(times[1] / 10000).to.be.closeTo(0.25, 0.01);
      expect(times[2] / 10000).to.be.closeTo(0.25, 0.01);
      expect(times[3] / 10000).to.be.closeTo(0.25, 0.01);
    });

    it('#randomInt specify', function() {
      expect(tools.randomInt(0, 0)).to.equal(0);
      expect(tools.randomInt(1, 1)).to.equal(1);
      expect(tools.randomInt(2, 2)).to.equal(2);
    })

    it('#err handle', function() {
      expect(tools.randomInt()).to.be.NaN;
      expect(tools.randomInt(3)).to.be.NaN;
      expect(tools.randomInt('a', 'b')).to.be.NaN;
    })
  })

  describe('#getProtocol', function() {
    it('#test 1', function() {
      expect(tools.getProtocol(['protocol', 'https'])).to.equal('https');
      expect(tools.getProtocol(['a', 'protocol', 'https', 'b'])).to.equal('https');
      expect(tools.getProtocol(['protocol'])).to.equal('');
      expect(tools.getProtocol(['https'])).to.equal('');
    });
    it('#err handle', function() {
      expect(tools.getProtocol()).to.equal('');
    })
  });
});

describe('#parseAddress', function() {
  it('#parseAddress only with address', function() {
    var service = {
      ServiceAddress: '192.168.67.241'
    };
    expect(tools.parseAddress(service)).to.equal('http://192.168.67.241');
  })

  it('#parseAddress without protocol tag', function() {
    var service = {
      ServiceTags: [],
      ServiceAddress: '192.168.67.241',
      ServicePort: 3003,
    };
    expect(tools.parseAddress(service)).to.equal('http://192.168.67.241:3003');
  })

  it('#parseAddress with protocol,value', function() {
    var service = {
      ServiceTags: ['protocol', 'nats'],
      ServiceAddress: '192.168.67.241',
      ServicePort: 3003,
    };
    expect(tools.parseAddress(service)).to.equal('nats://192.168.67.241:3003');
  })

  it('#err handle', function() {
    expect(tools.parseAddress()).to.equal('');
    expect(tools.parseAddress({})).to.equal('');
    expect(tools.parseAddress({
      hello: 'hello'
    })).to.equal('');
  })
})
