'use strict';

const logger = require('./logger');
const {
  urlQueue
} = require('./queues');
const {
  fetch
} = require('./fetchbrowser');

async function crawl_job(data, parser) {
  const url = data.url;
  logger.info("fetching %s", url, {});
  try {
    const resp = await fetch(url);
    logger.debug('fetched', url);
    if (resp.statusCode !== 200) {
      logger.debug('error    %s :HTTP status code = %d ; %s', url, resp.statusCode, resp.err);
    } else {
      const html = resp.content;
      await parser(resp.url, html, data);
      logger.debug('done     %s', url);
    }
  } catch (error) {
    logger.error('error    %s, %o', url, error);
  }
}

// TODO : add addJob function

function start(parser) {
  // Process
  urlQueue.process(5, async (job) => {
    if (job.data.end === true) {
      logger.info("closing");
    } else {
      return crawl_job(job.data, parser);
    }
  });

  urlQueue.on('drained', function() {
    urlQueue.close().then(function() {
      logger.info('done urlQueue.close()')
    });
  });
}

module.exports = {
  start: start
};
