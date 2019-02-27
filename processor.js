'use strict';

const logger = require('./logger');
const {
  urlQueue
} = require('./queues');
const {
  fetch,
  disconnect,
  disconnectAll,
  AbortController,
  CookieJar,
  fetch_html_options
} = require('./fetch');

async function crawl_job(data, parser) {
  const url = data.url;
  logger.info("fetching %s", url, {});
  try {
    const resp = await fetch(url, fetch_html_options);
    logger.debug('fetched  %s HTTP%d %s', url, resp.httpVersion, ', ', resp._mime);
    if (resp.status !== 200) {
      logger.debug('error    %s :HTTP status code = %d', url, resp.status);
    } else {
      const html = await resp.text();
      await parser(resp.url, html, data);
      // await disconnect(url);
      logger.debug('done     %s', url);
    }
  } catch (error) {
    logger.error('error    %s, %o', url, error);
  }
}

// TODO : add addJob function

function start(parser) {
  // Process
  urlQueue.process(30, async (job) => {
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
