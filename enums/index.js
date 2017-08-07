module.exports = {
  OBJECTS: ['cluster', 'apis', 'consumers', 'plugins', 'certificates', 'snis', 'upstreams'],
  IDENTIFIRES: {
    cluster: 'name',
    apis: 'id',
    consumers: 'id',
    plugins: 'id',
    certificates: 'id',
    snis: 'name',
    upstreams: 'id',
    targets: 'id'
  },
  REQUEST_TIMEOUT: 1500
};
