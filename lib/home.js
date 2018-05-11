'use strict';

var path = require('path');
var fs = require('fs');
var shell = require('shelljs');
var home = require('user-home');
var downloadNpm = require('download-npm-package');
var downloadGit = require('download-git-repo');
var ora = require('ora');

var uvw = require('uvw-node');
var ZipFile = require('uvw-node/lib/zip-file');
var NamedList = require('uvwlib/lib/named-list');

var MetaContext = require('uvw-node/uvw/meta-context');
var SimpleMeta = require('uvw-node/uvw/simple-meta');
var XbarDb = require('xbars/db');
var XbarWs = require('xbars/ws');

var SimHome = require('./sim/home');

var HOME_DIR = path.resolve(home, '.uvworkspace');

// Home is for package installation
// - let home also be a root context index
// - so that future augumentation same as other contexts

// TODO: home have hashId so that all PC's sites don't need hashing
var Home = SimpleMeta.subclass({
  init: function(cntx, opts) {
    opts = opts || {};

    /* fix me
    this.homeDir = opts.homeDir || HOME_DIR;
    this.pkgDir = opts.pkgDir || path.join(this.homeDir, 'pkgs');
    if (cntx) {
      this.cntx = cntx;
      cntx.setIndex(this);
    } else {
      this.cntx = MetaContext.instance(null, null, {
        rootType: '.uvworkspace',
        baseDir: path.resolve(this.homeDir),
        index: this,
        xbarDb: XbarDb.instance(),
      });
    }
    */

    this.simHome = SimHome.instance();
  },

  packages: function(opts) {
    return [];
  },
  instances: function(opts) {
    return [];
  },

  cli_info: function(args, opts) {
    console.log("INFO", args, opts);
  },

  // TODO: each homeCntx need to have uniq ID for installed package
  // - a package belong to exactly one homeCntx
  // - ideally both packages and their instances can be moved around
  // - a package can create home-kept instances without .uvw or meta directory
  //   . for purely running (hidden) app or non-dev projects
  installPackage: function(opts) {
    if (typeof opts === 'string') {
      var type, ch = opts[0];
      if (ch === '.' || ch === '/' || /^file:\/\//.test(opts)) {
        type = 'file';
      } else if (/^(@\w+\/)?[\w-_\.]+$/.test(opts)) {
        type = 'npm';
      } else if (/^git.*:\/\//.test(opts) || /^\w+\/[\w-_\.]+$/.test(opts)) {
        type = 'git';
      }
      opts = {
        type: type,
        url: opts,
      }
    }

    var pkgDir = this.pkgDir;

    var name = opts.name;
    if (!name) {
      name = opts.type === 'file' ? path.resolve(opts.url) : opts.url;
      name = path.basename(name).split('#')[0];
    }
    name = name.toLowerCase();
    if (opts.type === 'git' && path.extname(name) === '.git') {
      name = name.slice(0, name.length-4);
    }

    var fpath = path.resolve(pkgDir, name);
    if (uvw.isDir(fpath)) return 'package ' + name + ' exists';

    var ret, pkgSpec;
    if (opts.type === 'file') {
      var spec = uvw.packageSpec(opts.url, true);
      if (spec) {
        pkgSpec = { 
          name: name,
          type: 'file',
          url: path.resolve(opts.url),
        };

        shell.mkdir(fpath);
        fs.writeFileSync(path.join(fpath, '_meta.json'),
          JSON.stringify(pkgSpec, null, 2));
      }
    } else if (opts.type === 'npm') {
      pkgSpec = {
        name: name,
        type: 'npm',
        url: opts.url,
      };

      var spinner = ora('Downloading ' + name + ' from ' + opts.url);
      spinner.start();
      ret = downloadNpm({
        arg: opts.url,
        dir: pkgDir,
      }).then(function() {
        if (opts.url !== name) {
          var sub = path.resolve(pkgDir, opts.url);
          if (uvw.isDir(sub)) shell.mv(sub, pkgDir);

          uvw.assert(uvw.isDir(fpath));
        }
        spinner.stop();
        console.log();
        console.log('Complete');
      }).catch(function(err) {
        spinner.stop();
        console.log();
        console.error(err);
      });
    } else if (opts.type === 'git') {

      pkgSpec = {
        name: name,
        type: 'git',
        url: opts.url,
      };

      var spinner = ora('Downloading ' + name + ' from ' + opts.url);
      spinner.start();
      ret = new Promise(function(resolve, reject) {
        downloadGit(opts.url, fpath, { clone: false }, err => {
          spinner.stop()
          console.log()
          if (err || !uvw.isDir(fpath)) {
            reject('Failed to download repo ' + opts.url + ': ' + err.message.trim());
          } else {
            console.log('Complete');
            resolve();
          }
        });
      });
    }

    if (!pkgSpec) throw new Error('cannot handle package type ' + opts.type);

    var simHome = this.simHome;
    if (ret) {
      return ret.then(function() {
        simHome.setPackage(name, pkgSpec);
        return 'installed package' + name + ' at ' + opts.url;
      });
    } else {
      simHome.setPackage(name, pkgSpec);
      return 'installed package' + name + ' at ' + opts.url;
    }

    /*
    .then(() => function() {
    .catch(err => console.error(err));
    var pkgDir = path.resolve(Home.PACKAGES_DIR, pkgName);
    if (shell.test('-d', pkgDir)) {
      console.log(pkgDir, 'exists');
      shell.cd(pkgDir);
      shell.exec('npm install');
      return;
    }

    utils.downloadNpm({
      arg: pkgName,
      dir: Home.PACKAGES_DIR
    }).then(function(ret) {
      console.log("RET", ret);
    }).catch(function(err) {
      console.log("ERR", ret);
    });
    */
  },

  createPackage: function(pkgName, extName) {
    if (uvw.findSpec(pkgName)) return 'Inside some package or instance';

    if (!/^\w[\w\._-]*\w$/.test(pkgName)) return 'Invalid name ' + pkgName;

    var fpath = path.resolve(pkgName);
    if (uvw.exists(fpath)) return pkgName + ' exists';

    var pkgJson;
    if (extName) {
      var spec = uvw.findSpec(extName);
      if (!spec) return 'Package ' + extName + ' not found';
      if (spec.rootType !== 'package.json') {
        return 'Invalid package type:', spec.rootType;
      }
      pkgJson = {
        name: pkgName,
        uvw: true,
        private: true
      };
    } else {
      pkgJson = {
        name: pkgName,
        uvw: true,
        private: true
      };
    }

    pkgJson.dependencies = {
      "uvw-node": "^0.0.4",
      "uvwlib": "^0.0.5"
    };

    shell.mkdir(fpath);
    fs.writeFileSync(path.join(fpath, 'package.json'),
      JSON.stringify(pkgJson, null, 2));
    shell.mkdir(path.join(fpath, 'meta'));

    var s = [
      "'use strict;'", '',
      "var SimpleIndex = require('uvw-node/uvw/simple-index');", '',
      'module.exports = SimpleIndex.subclass({',
      '  cli_info: function() {',
      "    console.log('Hello, uvw');",
      '  }',
      '});'
    ];
    fs.writeFileSync(path.join(fpath, 'meta', 'index.js'), s.join('\n'));

    return 'Package ' + pkgName + ' created';
  },

  deployPackage: function(pkgName, instName, opts) {
    var spec;
    if (pkgName[0] === '.' || pkgName[0] === '/') {
      spec = uvw.findSpec(pkgName);
    } else {
      spec = uvw.packageSpec(path.join(this.pkgDir, pkgName));
    }

    if (!spec) return 'Package ' + pkgName + ' not found';
    if (spec.rootType !== 'package.json') {
      return 'Invalid package type ' + spec.rootType;
    }

    var cntx = MetaContext.instance(null, null, spec);
    var index = cntx.index();
    var args = instName ? [instName] : [];
    return index.uvw_init(args, opts || {});
  },
});

module.exports = Home;
