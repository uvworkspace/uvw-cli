'use strict';

var path = require('path');
var repl = require('repl');

var uvwlib = require('uvwlib');
var Ws = require('uvw-node/ws');

var Repl = uvwlib.class({
  init: function(rootCntx, initPath) {
    this.cntx = rootCntx;
    this.initPath = initPath;
    this._wss = null;
    this._ws = null;
  },
  start: function() {
    console.log(this.cntx.baseDir);

    var ret = this.cntx.evaluate({
      path: this.initPath,
      cmd: 'info', args: [], opts: {}
    });
    if (ret !== undefined) console.log(ret);

    var replServer = repl.start({
      prompt: 'uvw> ',
      eval: this.eval.bind(this)
    });
    replServer.on('exit', function() {
      console.log('Bye');
      process.exit();
    });
  },

  eval: function(cmd, context, filename, callback) {
    cmd = cmd.trim();

    if (cmd === 'xbar start') {
      if (!this._ws) { 
        this._ws = Ws.Wsc.instance();
        this._ws.start();
      }
    } else if (cmd.slice(0, 5) === 'xbar ') {
      if (this._ws) this._ws.send(cmd.slice(5));
    } else if (cmd === 'xbars start') {
      if (!this._wss) { 
        this._wss = Ws.instance();
        this._wss.start();
      }
    } else {
      console.log('CMD:', cmd);
    }

    callback();
  },
});

module.exports = Repl;
