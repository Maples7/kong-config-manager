'use strict';

const fs = require('fs');
const test = require('ava');
const filenameConverter = require('filename-converter');
const fse = require('fs-extra');
const rp = require('request-promise');
const shell = require('shelljs');
const db = require('./kong-mock-server/lib/db');

test.before(t => {
  // wait initial data finished
  shell.exec('sleep 1');
  shell.cd('test');
  fse.writeJsonSync(
    './kcm-config.json',
    {
      main: {
        host: 'http://localhost:3001'
      },
      'sec:test': {
        host: 'http://localhost:3001'
      },
      wrong1: [],
      wrong2: {
        host: []
      },
      wrong3: {},
      wrong4: {
        host: 'str',
        objects: ['wrongobj']
      },
      wrong5: {
        host: 'str',
        objects: 'strtoo'
      }
    },
    {
      spaces: 2
    }
  );
});

test.serial('kcm init', t => {
  t.plan(2);

  const ret = shell.exec('kcm init');
  t.is(ret.code, 0);

  const cliConfig = require('./kong-config/kcm-config');
  t.is(cliConfig.main.host, 'http://localhost:8001');

  shell.rm('-rf', 'kong-config');
});

test.serial('kcm init -d my-kong-config', t => {
  t.plan(2);

  const ret = shell.exec('kcm init -d my-kong-config');
  t.is(ret.code, 0);

  const cliConfig = require('./my-kong-config/kcm-config');
  t.is(cliConfig.main.host, 'http://localhost:8001');

  shell.rm('-rf', 'my-kong-config');
});

test.serial('kcm init -d kong-mock-server', t => {
  t.plan(1);

  const ret = shell.exec('kcm init -d kong-mock-server');
  t.is(ret.code, 1);
});

test.serial('kcm dump -i wrong1', t => {
  t.plan(1);
  const ret = shell.exec('kcm dump -i wrong1');
  t.is(ret.code, 1);
});

test.serial('kcm dump -i wrong2', t => {
  t.plan(1);
  const ret = shell.exec('kcm dump -i wrong2');
  t.is(ret.code, 1);
});

test.serial('kcm dump -i wrong4', t => {
  t.plan(1);
  const ret = shell.exec('kcm dump -i wrong4');
  t.is(ret.code, 1);
});

test.serial('kcm dump -i wrong5', t => {
  t.plan(1);
  const ret = shell.exec('kcm dump -i wrong5');
  t.is(ret.code, 1);
});

test.serial('kcm dump -i wrong3', t => {
  t.plan(1);
  const ret = shell.exec('kcm dump -i wrong3');
  t.is(ret.code, 1);

  fse.writeJsonSync(
    './kcm-config.json',
    {
      main: {
        host: 'http://localhost:3001'
      },
      'sec:test': {
        host: 'http://localhost:3001',
        objects: ['apis', 'plugins', 'certificates', 'snis', 'upstreams']
      }
    },
    {
      spaces: 2
    }
  );
});

test.serial('DEBUG=kcm:dump kcm dump --all', t => {
  t.plan(7);
  const ret = shell.exec('DEBUG=kcm:dump kcm dump --all');

  t.is(ret.code, 0);
  const api1 = require(`./${filenameConverter.serialize(
    'sec:test'
  )}/apis/api1.json`);
  t.is(api1.name, 'api1');
  t.is(api1.upstream_url, 'httpbin.com');
  const target1 = require('./main/upstreams_service.v1.xyz_targets/4661f55e-95c2-4011-8fd6-c5c56df1c9db.json');
  t.is(target1.id, '4661f55e-95c2-4011-8fd6-c5c56df1c9db');
  t.is(target1.weight, 15);
  t.true(
    !fs.existsSync(`./${filenameConverter.serialize('sec:test')}/consumers`)
  );
  t.true(
    !fs.existsSync(`./${filenameConverter.serialize('sec:test')}/cluster`)
  );
});

test.serial('kcm dump --host http://localhost:3001', t => {
  t.plan(3);
  const ret = shell.exec('kcm dump --host http://localhost:3001');

  t.is(ret.code, 0);
  const plugin1 = require('./main/plugins/halo-auth.json');
  t.is(plugin1.name, 'halo-auth');
  t.is(plugin1.enabled, true);
});

test.serial('kcm dump --file ./kcm-config.json', t => {
  t.plan(3);
  const ret = shell.exec('kcm dump --file ./kcm-config.json');

  t.is(ret.code, 0);
  const cluster = require(`./main/cluster/${filenameConverter.serialize(
    '064f9f98619d_0.0.0.0:7946_d5593e0d422840519b0ec828a73af045.json'
  )}`);
  t.is(cluster.status, 'alive');
  t.is(cluster.address, '1.2.3.4:7946');
});

test.serial('kcm dump --instance wrongins', t => {
  t.plan(1);
  const ret = shell.exec('kcm dump --instance wrongins');
  t.is(ret.code, 1);
});

test.serial('DEBUG=kcm:apply kcm apply --yes', t => {
  t.plan(5);
  // rm a consumer - DELETE
  shell.rm('-rf', './main/consumers/2d324024-8fdb-20a5-g044-62b19db411d1.json');

  // disable a plugin - PATCH
  const plugin1Path = './main/plugins/halo-auth.json';
  const plugin1 = require(plugin1Path);
  plugin1.enabled = false;
  fse.writeJsonSync(plugin1Path, plugin1, { spaces: 2 });

  // add a new snis - POST
  fse.writeJsonSync(
    './main/snis/httpbin.com.json',
    {
      name: 'httpbin.com',
      ssl_certificate_id: '16c39eab-49d9-40f9-a55e-c4ee47fada68',
      created_at: 1485531710212
    },
    { spaces: 2 }
  );

  const ret = shell.exec('DEBUG=kcm:apply kcm apply --yes');

  t.is(ret.code, 0);
  // verify DELETE
  const consumers = fs.readdirSync('./main/consumers');
  t.is(consumers.length, 1);
  t.is(consumers[0], '4d924084-1adb-40a5-c042-63b19db421d1.json');
  // verify PATCH
  const newPlugin1 = require(plugin1Path);
  t.is(newPlugin1.enabled, false);
  // verify POST
  const snis = fs.readdirSync('./main/snis');
  t.is(snis.length, 3);
});

test.serial(
  'kcm apply --host http://localhost:3001 --instance main --yes',
  t => {
    t.plan(2);
    shell.rm('-rf', './main/plugins/rate-limiting.json');

    const ret = shell.exec(
      'kcm apply --host http://localhost:3001 --instance main --yes'
    );

    t.is(ret.code, 0);
    const plugins = fs.readdirSync('./main/plugins');
    t.is(plugins.length, 1);
  }
);

test.serial('kcm dump --instance sec:test', t => {
  t.plan(1);
  const ret = shell.exec('kcm dump --instance sec:test');
  t.is(ret.code, 0);
});

// At this point, local configs of `main` and `sec:test` are synced

test.serial('kcm apply --all --yes', t => {
  t.plan(1);
  const ret = shell.exec('kcm apply --all --yes');
  t.is(ret.code, 0);
});

test.serial('kcm apply -y --instance wrongins', t => {
  t.plan(1);
  const ret = shell.exec('kcm apply -y --instance wrongins');
  t.is(ret.code, 1);
});

test.serial('kcm apply --instance sec:test --yes', t => {
  t.plan(1);
  shell.rm('-rf', `./${filenameConverter.serialize('sec:test')}`);
  const ret = shell.exec('kcm apply --instance sec:test --yes');
  t.is(ret.code, 1);
});

test.serial('404 when upstream does not exist operating some target', t => {
  t.plan(1);
  const dir = './main/upstreams_404lalala_targets';
  shell.mkdir('-p', dir);
  const ret = shell.exec('kcm apply --yes');
  t.is(ret.code, 1);
  shell.rm('-rf', dir);
});
