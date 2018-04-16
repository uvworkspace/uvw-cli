'use strict';

var tap = require('tap');

var vault = require('../lib/auth/vault');

tap.test('can save password', async function (t) {
  var ret = await vault.setPassword('user', 'pass')
  t.false(ret);
  var res = await vault.getPassword('user');
  t.equal(res, 'pass');
  t.end();
});

