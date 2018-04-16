'use strict';

var home = require('user-home');
var path = require('path');

var uvwlib = require('uvwlib');
var uvwUtils = require('uvw-node/uvw/utils');
var ZipFile = require('uvw-node/lib/zip-file');
var NamedList = require('uvwlib/lib/named-list');

var SimCntx = require('./cntx/sim');

var HOME_DIR = path.resolve(home, '.uvw');

var Cli = uvwlib.class({
  HOME_DIR: HOME_DIR,
  init: function (opts) {
    opts = opts || {};

    this.homeCntx = opts.homeCntx || SimCntx.instance();
    this.rootMeta = opts.meta;

    // shell state
    this.curMeta = this.rootMeta;
    return this;
  },

  packages: function(opts) {
    return this.homeCntx.packages(opts);
  },
  instances: function(opts) {
    return this.homeCntx.instances(opts);
  },

  // TODO: each homeCntx need to have uniq ID for installed package
  // - a package belong to exactly one homeCntx
  // - ideally both packages and their instances can be moved around
  // - a package can create home-kept instances without .uvw or meta directory
  //   . for purely running app or non-dev projects
  install: function(opts) {
    if (opts.type === 'local') {
      var spec = uvwUtils.findSpec(opts.path);
      // TODO: need error reporting service from homeCntx
      if (spec && spec.type === 'package.json') {
        this.homeCntx.setPackage(spec.json.name, {
          name: spec.json.name,
          type: 'local',
          specType: spec.type,
          spec: spec
        });
      }
    }
  },
});

module.exports = Cli;
