const fs = require('fs');
const test = require('ava');
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
      main: 'http://localhost:3001',
      sec_test: 'http://localhost:3001'
    },
    {
      spaces: 2
    }
  );
});

test.serial('DEBUG=kcm:dump kcm dump --all', t => {
  t.plan(5);
  const ret = shell.exec('DEBUG=kcm:dump kcm dump --all');

  t.is(ret.code, 0);
  const api1 = require('./sec_test/apis/60d8c00b-1d2e-4dab-8dfc-b3a8e04aa891.json');
  t.is(api1.name, 'api1');
  t.is(api1.upstream_url, 'httpbin.com');
  const target1 = require('./main/upstreams_13611da7-703f-44f8-b790-fc1e7bf51b3e_targets/4661f55e-95c2-4011-8fd6-c5c56df1c9db.json');
  t.is(target1.id, '4661f55e-95c2-4011-8fd6-c5c56df1c9db');
  t.is(target1.weight, 15);
});

test.serial('kcm dump --host http://localhost:3001', t => {
  t.plan(3);
  const ret = shell.exec('kcm dump --host http://localhost:3001');

  t.is(ret.code, 0);
  const plugin1 = require('./main/plugins/3d324d84-1sdb-30a5-c043-63b19db421d1.json');
  t.is(plugin1.name, 'halo-auth');
  t.is(plugin1.enabled, true);
});

test.serial('kcm dump --file ./kcm-config.json', t => {
  t.plan(3);
  const ret = shell.exec('kcm dump --file ./kcm-config.json');

  t.is(ret.code, 0);
  const cluster = require('./main/cluster/064f9f98619d_0.0.0.0:7946_d5593e0d422840519b0ec828a73af045.json');
  t.is(cluster.status, 'alive');
  t.is(cluster.address, '1.2.3.4:7946');
});

test.serial('kcm dump --instance wrongins', t => {
  t.plan(1);
  const ret = shell.exec('kcm dump  --instance wrongins');

  t.is(ret.code, 1);
});

test.serial('DEBUG=kcm:apply kcm apply', t => {
  t.plan(5);
  // rm a consumer - DELETE
  shell.rm('-rf', './main/consumers/2d324024-8fdb-20a5-g044-62b19db411d1.json');

  // disable a plugin - PATCH
  const plugin1Path =
    './main/plugins/3d324d84-1sdb-30a5-c043-63b19db421d1.json';
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

  const ret = shell.exec('DEBUG=kcm:apply kcm apply');

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

test.serial('kcm apply --host http://localhost:3001 --instance main', t => {
  t.plan(2);
  shell.rm('-rf', './main/plugins/4d924084-1adb-40a5-c042-63b19db421d1.json');

  const ret = shell.exec('kcm apply --host http://localhost:3001 --instance main');

  t.is(ret.code, 0);
  const plugins = fs.readdirSync('./main/plugins');
  t.is(plugins.length, 1);
});

test.serial('kcm dump --instance sec_test', t => {
  t.plan(1);
  const ret = shell.exec('kcm dump --instance sec_test');
  t.is(ret.code, 0);
});

// At this point, local configs of `main` and `sec_test` are synced

test.serial('kcm apply --all', t => {
  t.plan(1);
  const ret = shell.exec('kcm apply --all');
  t.is(ret.code, 0);
});

test.serial('kcm apply --instance wrongins', t => {
  t.plan(1);
  const ret = shell.exec('kcm apply --instance wrongins');
  t.is(ret.code, 1);
});

test.serial('kcm apply --instance sec_test', t => {
  t.plan(1);
  shell.rm('-rf', './sec_test');
  const ret = shell.exec('kcm apply --instance sec_test');
  t.is(ret.code, 1);
});
