'use strict';

var path = require('path');
var repl = require('repl');

var uvwlib = require('uvwlib');
var Cli = require('./cli');

var Repl = uvwlib.class({
  init: function(opts) {
    this.cli = Cli.instance(opts);
  },
  start: function() {
    var cli = this.cli;
    cli.exec('info');

    var replServer = repl.start({
      prompt: 'uvw> ',
      eval: function(cmd, replCntx, filename, callback) {
        cli.repl(cmd, replCntx, callback);
      },
    });
    replServer.on('exit', function() {
      console.log('Bye');
      process.exit();
    });
  },
});

module.exports = Repl;
