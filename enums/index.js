'use strict';

module.exports = {
  OBJECTS: {
    '0.10.x': ['cluster', 'apis', 'consumers', 'plugins', 'certificates', 'snis', 'upstreams'],
    '0.11.x': ['apis', 'consumers', 'plugins', 'certificates', 'snis', 'upstreams']
  },
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
