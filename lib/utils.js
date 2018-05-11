'use strict';

var path = require('path');

var Commander = require('uvw-commander/browser');

var CliService = require('uvwlib/uvw/cli-service');
var DirContext = require('uvwlib/uvw/dir-context');
var specs = require('uvwlib/uvw/simple-specs');

var XbarService = require('xbars/db/xbar-service');
var XbarMixin = require('uvwlib/xbar/xbar-mixin');

exports.findRootContext = findRootContext;
function findRootContext(fpath, opts) {
  opts = opts || {};
  var spec = specs.findRootSpec(fpath, opts);
  if (spec && typeof spec === 'object') {
    //if (opts.sim) {
    //spec.xbarDb = SimDb.instance(opts);
    //} else {
      //var homeDir = spec.root && spec.root.homeDir;
      //spec.xbarDb = XbarDb.instance({
      //  homeDir: homeDir && path.resolve(spec.baseDir, homeDir),
      //});
    //}

    var root = DirContext.instance(null, null, spec);
    root.addService(CliService.instance('cli', root)); 

    root.addService(XbarService.instance('xbar', root));
    root.addMixin(XbarMixin); // let DirContext mixin saves this
    return root;
  };
}

exports.parseCommand = parseCommand;
function parseCommand(line) {
  var prog = new Commander('uvw-cli');
  prog.allowUnknownOption().parse(line.split(/ +/));

  return {
    cmd: prog.args[0] || 'info',
    args: prog.args.slice(1),
    opts: prog.collectedOptions,
  };
}

exports.evaluate = function(fpath, cmd, args, opts) {
  var root = findRootContext(fpath);
  if (!root) return console.error('root context not found');
  if (!root.spec && !root.spec.initPath) return console.error('missing or invalid spec');

  return root.service('cli').execute({
    path: root.spec.initPath,
    cmd: cmd,
    args: args,
    opts: opts
  });
};

exports.configIndex = function(fpath, args, opts) {
  var root = findRootContext(fpath);
  if (!root) return console.error('root context not found');
  if (!root.spec && !root.spec.initPath) return console.error('missing or invalid spec');

  if (process.cwd() !== root.baseDir) console.log('- go to ', root.baseDir);
  console.log('- change package.json uvw.meta.mtype to', opts.mtype);
};
