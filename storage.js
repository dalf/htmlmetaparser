'use strict';

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

function store(metadata) {
  // Nothing for now
}

function loadByUrl(url) {
  //
}

module.exports = {
  store,
  loadByUrl
}
