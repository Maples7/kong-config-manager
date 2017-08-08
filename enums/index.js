'use strict';

module.exports = {
  OBJECTS: ['cluster', 'apis', 'consumers', 'plugins', 'certificates', 'snis', 'upstreams'],
  IDENTIFIRES: {
    cluster: 'name',
    apis: 'name',
    consumers: 'id',
    plugins: 'name',
    certificates: 'id',
    snis: 'name',
    upstreams: 'name',
    targets: 'id'
  },
  REQUEST_TIMEOUT: 1500
};
