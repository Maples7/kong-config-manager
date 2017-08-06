const test = require('ava');
const fse = require('fs-extra');
const rp = require('request-promise');
const shell = require('shelljs');
const initData = require('./init-data/');
const db = require('./kong-mock-server/lib/db');

test.before(t => {
  shell.exec('node ./kong-mock-server/index', (code, stdout, stderr) => {
    console.log('Mock Server Exit code:', code);
    console.log('Mock Server output:', stdout);
    console.log('Mock Server stderr:', stderr);
  });
  shell.exec('sleep 2');
  fse.writeJsonSync(
    './kcm-config.json',
    {
      main: 'localhost:3001',
      sec_test: 'localhost:3001'
    },
    {
      spaces: 2
    }
  );
});

test.beforeEach(async t => {
  const numRemoved = await db.removeAsync({}, { multi: true });
  console.log(`nedb was flushed! (${numRemoved} items)`);
  await Promise.all(
    Object.keys(initData).map(async obj => {
      await db.insertAsync(initData.obj);
    })
  );
});

test('DEBUG=kcm* kcm dump --all', t => {
  const ret = shell.exec('DEBUG=kcm* kcm dump --all');

  t.is(ret.code, 0);
  const api1 = require('./main/apis/60d8c00b-1d2e-4dab-8dfc-b3a8e04aa891.json');
  t.is(api1.name, 'api1');
  t.is(api1.upstream_url, 'mockbin.com');
});
