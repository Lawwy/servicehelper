module.exports = wrapExpress;

var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

function wrapExpress(routes) {
  var app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: false
  }));
  var router = setRouter(routes)
  app.use('/', router);
  return app;
}


/*
  [
    {
      route:'',
      method:'GET',  //'POST'
      handler:[Function]
    }
  ]
*/
function setRouter(routes) {
  var router = express.Router();
  routes.forEach(route => {
    var method = route.method.toLocaleLowerCase();
    router[method](route.route, wrapFn(route.handler));
  })
  return router;
}

function wrapFn(fn) {
  return function(req, res, next) {
    var params = getParameters(req);
    fn(params, function(err, output) {
      var result = {};
      res.type('json');
      if (err) {
        res.status(500);
        result.success = false;
        result.message = err.message;
        return res.send(result);
      }
      result = _.isObject(output) ? output : {
        result: output
      };
      result.success = true;
      return res.send(result);
    })
  }
}

function getParameters(req) {
  switch (req.method) {
    case 'POST':
      return req.body;
    case 'GET':
      return req.query;
    default:
      return {};
  }
}
