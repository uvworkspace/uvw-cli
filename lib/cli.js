'use strict';

var home = require('user-home');
var path = require('path');

var uvwlib = require('uvwlib');
var Commander = require('uvw-commander/browser');
var ZipFile = require('uvwlib/node/zip-file');
var NamedList = require('uvwlib/lib/named-list');

//var SimHome = require('./sim/home');

var Cli = uvwlib.class({
  init: function (opts) {
    opts = opts || {};
    //this.home = opts.home || SimHome.instance();
    this.rootCntx = opts.rootCntx;

    var relPath = opts.path || this.rootCntx.spec.initPath;
    var ret = this.rootCntx.followPath(relPath);
    this.curCntx = ret.context;
    this.curPath = ret.path;
  },

  exec: function(cmd) {
    var prog = new Commander('uvw-cli');
    prog.allowUnknownOption().parse(cmd.split(/ +/));

    var cmd = prog.args[0] || 'info';
    var args = prog.args.slice(1);
    var opts = prog.collectedOptions;

    var ret;
    if (cmd === 'cd') {
      ret = this.curCntx.followPath(args[0]);
      if (ret.path.length !== 0) return args[0] + ' not found';

      this.curCntx = ret.context;
      return 'changed to ' + this.curCntx.path.join('/');
    } else if (cmd[0] === '.') {
      ret = this.curCntx.followPath(cmd);
      return ret.context.service('cli').execute({
        path: ret.context.path.concat(ret.path),
        cmd: args[0] || 'info',
        args: args.slice(1),
        opts: opts,
      });
    } else {
      return this.curCntx.service('cli').execute({
        path: this.curCntx.path.slice(), // safety 
        cmd: cmd,
        args: args,
        opts: opts
      });
    }
  },

  repl: function(cmd, replCntx, callback) {
    cmd = cmd.trim();
    if (!cmd) return callback();

    var ret = this.exec(cmd);
    if (uvwlib.isPromise(ret)) {
      ret.then(function(r) {
        if (typeof r !== 'undefined') console.log(r);
        callback();
      }).catch(callback);
    } else {
      if (typeof ret !== 'undefined') console.log(ret);
      callback();
    }
  },
});

module.exports = Cli;
