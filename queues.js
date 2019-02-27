'use strict';

const Queue = require('bull');

const urlQueue = new Queue('url', 'redis://127.0.0.1:6379');

module.exports = {
  urlQueue
};
