'use strict';

var uvwlib = require('uvwlib');

function pwd (cur) {
  var name= cur.name();
  if (!cur.parent) {
    return name ? '//' + name + '/' : '/';
  } else {
    return pwd(cur.parent) + (cur.parent.parent ? '/' + name: name);
  }
}

var Shell = uvwlib.class({
  init: function (meta, cli) {
    this.cli = cli;
    this.rootMeta = meta;
    this.curMeta = this.rootMeta;
    return this;
  },

  pwd: function (meta) {
    return pwd(this.curMeta);
  },
  cd: function (name) {
    var ch = this.curMeta.child(name);
    if (ch) {
      this.curMeta = ch;
      return this;
    }
  },
  send: function (cmd) {
    var args = uvwlib.slice(arguments, 1);
    return this.curMeta[cmd].apply(this.curMeta, args);
  },
});

module.exports = Shell;
