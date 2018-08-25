// var sh = require('./servicehelper');
var _ = require('underscore');

module.exports = Face;

function Face() {
}

Face.prototype.bind = function(cmd, handler, opt) {
  throw new Error('bind is not implemented');
};

Face.prototype.do = function(opt, cb) {
  throw new Error('do is not implemented');
};

Face.prototype.close = function() {
  throw new Error('close is not implemented');
}
