'use strict';

var uvwlib = require('uvwlib');
var NamedList = require('uvwlib/lib/named-list');

// proxy to:
// - cli db
// - vault
// - xbar
// - logging and error reporting
//
var SimCntx = uvwlib.class({
  init: function() {
    this._pkgs = NamedList.instance([], 'name');
    this._insts = NamedList.instance([], 'name'); 
    return this;
  },

  packages: function(opts) {
    return this._pkgs.filter(opts); 
  },
  getPackage: function(name) {
    return this._pkgs.get(name);
  },
  setPackage: function(name, pkg) {
    this._pkgs.add(uvwlib.assign({}, pkg, { name: name }));
    return this.getPackage(name);
  },
  updatePackage: function(name, rec) {
    return this._pkgs.update(name, rec);
  },

  instances: function(opts) {
    return this._insts.filter(opts);
  },
  getInstance: function(name) {
    return this._insts.get(name);
  },
  setInstance: function(name, rec) {
    this._insts.add(uvwlib.assign({}, rec, { name: name }));
    return this.getInstance(name);
  },
  updateInstance: function(name, rec) {
    return this._insts.update(name, rec);
  },
});

module.exports = SimCntx;
