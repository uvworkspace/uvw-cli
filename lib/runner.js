'use strict';

var path = require('path');
var fs = require('fs');
var uvwlib = require('uvwlib');
var uvwUtils = require('uvwlib/uvw');
var ChunkBuffer = require('uvwlib/node/chunk-buffer');
var Commander = require('uvw-commander/browser');

var specs = require('uvwlib/uvw/simple-specs');
var cliUtils = require('./utils');

var Runner = uvwlib.class({
  init: function(baseDir, initOpts) {
    this.roots = {};
    this.rootSpecs = {};
    this.baseDir = baseDir ? path.resolve(baseDir) : null;
    this.initOpts = initOpts || {};
    this.curRoot = null;

    var wsp = this.initOpts.ws;
    if (wsp) this._ws = this.findRoot(wsp, this.initOpts).rootCntx.index();
  },

  findRoot: function(fpath, opts) {
    if (fpath) {
      fpath = this.baseDir ? path.resolve(this.baseDir, fpath) : path.resolve(fpath);
    } else {
      fpath = this.baseDir;
    }
    uvwlib.assert(fpath, 'no init root');

    if (this.rootSpecs[fpath]) {
      return this.rootSpecs[fpath];
    } else {
      var spec = specs.findRootSpec(fpath);
      uvwlib.assert(spec, 'context not found for ' + fpath);
      if (this.roots[spec.baseDir]) {
        return {
          rootCntx: this.roots[spec.baseDir],
          path: spec.initPath
        };
      } else {
        if (this._ws) opts.xbarWs = this._ws;
        var cntx = cliUtils.findRootContext(fpath, opts);
        uvwlib.assert(cntx, 'context not found for ' + fpath);
        this.roots[cntx.baseDir] = cntx;
        return this.rootSpecs[fpath] = {
          rootCntx: cntx,
          path: cntx.spec.initPath,
        };
      }
    }
  },

  execLine: function(line) {
    line = line.trim();
    if (!line || line[0] === '#') return;

    var prog = new Commander('uvw-cli');
    prog.allowUnknownOption().parse(line.split(/ +/));

    var args = prog.args;
    var opts = prog.collectedOptions;
    var arg = args[0];
    var fpath = arg && (arg[0] === '.' || arg[0] === '/') ? arg : null;
    var n = fpath ? 1 : 0;
    var cmd = args[n] || 'info';
    args = args[n] ? args.slice(n+1) : [];

    if (cmd === '@base') {
      uvwlib.assert(args[0], 'missing init dir');
      this.baseDir = path.resolve(args[0]);
      this.initOpts = opts;
      var wsp = this.initOpts.ws;
      this._ws = wsp && this.findRoot(wsp, this.initOpts).rootCntx.index();
      return;
    }

    if (cmd === '@chroot') {
      opts = uvwlib.assign({}, this.initOpts, opts);
      this.curRoot = this.findRoot(args[0], opts).rootCntx;
    } else {
      var spec = fpath ? this.findRoot(fpath) : {
        rootCntx: this.curRoot,
        path: []
      };
      uvwlib.assert(spec.rootCntx, fpath ? 'no root at ' + fpath : 'root not found');

      var ret = spec.rootCntx.service('cli').execute({
        path: spec.path,
        cmd: cmd,
        args: args,
        opts: opts
      }
      if (ret !== undefined) {
        return ret && typeof ret === 'object' ? JSON.stringify(ret, null, 2) : String(ret);
      }
    }
  },

  run: function(file) {
    var me = this;
    if (file) {
      var s = fs.readFileSync(file, 'utf8');
      s.split('\n').forEach(function(line) {
        if (me.initOpts.verbose) console.log('>', line);
        var ret = me.execLine(line);
        if (ret !== undefined) console.log(ret);
      });
    } else {
      var buf = ChunkBuffer.instance({
        handler: function(line) {
          if (me.initOpts.verbose) buf.push('> ' + line);
          return me.execLine(line);
        },
      });
      process.stdin.setEncoding('utf8').pipe(buf).pipe(process.stdout);
    }
  },
});

module.exports = Runner;

