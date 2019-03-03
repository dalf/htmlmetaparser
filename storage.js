'use strict';

const elasticsearch = require('elasticsearch');
const crypto = require('crypto');

const client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'debug'
});


function urlToId(url) {
  const hash = crypto.createHash('sha256');
  hash.update(url);
  return hash.digest('hex');
}

function init() {
  client.indices.create({
    index: 'url'
  }, function(err, resp, status) {
    if (err) {
      console.log(err);
    } else {
      console.log("create", resp);
    }
  });
}

function storeUrl(data) {
  client.index({
    index: 'url',
    id: urlToId(data['url']),
    type: 'url',
    body: data
  }, function(err, resp, status) {
    console.log(resp);
  });
}

function loadUrl(url) {
  //
}

module.exports = {
  storeUrl,
  loadUrl
}
