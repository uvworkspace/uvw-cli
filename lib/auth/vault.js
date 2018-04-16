'use strict';

var keytar = require('keytar');

module.exports = {
  setPassword: function(name, pass) {
    return keytar.setPassword('uvw', name, pass);
  },
  getPassword: function(name) {
    return keytar.getPassword('uvw', name);
  },
};
