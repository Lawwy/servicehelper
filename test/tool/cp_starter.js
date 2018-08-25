var cp = require('child_process');

function setupNats(cb) {
  console.log('???');
  var cmd = 'gnatsd';
  var args = ["-p", "4333"];
  var p = setup(cmd, args);
  p.stderr.on('data', function(chunk) {
    if (chunk.toString().indexOf("Server is ready") > -1) {
      return cb(null, p);
    }
  })
}

function setupConsul(cb) {
  var cmd = 'consul';
  var args = ["agent", "-dev", "-bootstrap"];
  var p = setup(cmd, args);
  p.stdout.on('data', function(chunk) {
    if (chunk.toString().indexOf("Synced service 'consul'") > -1) {
      console.log('consul success');
      return cb(null, p);
    }
  })
}

function setup(cmd, args, options) {
  args = args || [];
  var proc = cp.spawn(cmd, args);
  return proc;
}


module.exports = {
  setup: setup,
  setupConsul: setupConsul,
  setupNats: setupNats
}
