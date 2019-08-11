'use strict';

const {
  got,
  got_image_options
} = require('./fetch');
const b64toBuff = require('base64-arraybuffer');
const icoToPng = require('ico-to-png');
const fileType = require('file-type');
const logger = require('./logger');

const icoMimeType = new Set(['image/vnd.microsoft.icon', 'image/x-icon', 'image/ico', 'image/icon', 'text/ico', 'application/ico']);

async function image_to_png_base64(mime, buffer) {
  const detectedMime = fileType(Buffer.from(buffer));
  if (detectedMime !== null) {
    logger.debug('image declared as %s but %s is detected', mime, detectedMime.mime);
    mime = detectedMime.mime;
  }

  if (icoMimeType.has(mime)) {
    try {
      buffer = await icoToPng(buffer, 128);
      mime = 'image/png';
    } catch (error) {
      logger.error(error);
    }
  }
  if (mime.startsWith('image/')) {
    return 'data:' + mime + ';base64,' + b64toBuff.encode(buffer);
  } else {
    return null;
  }
}

async function fetch_image_url_to_base64(url) {
  logger.info('fetching %s', url);
  try {
    const resp = await fetch(url, fetch_image_options);
    if (resp.status === 200) {
      return image_to_png_base64(resp._mime, await resp.arrayBuffer());
    } else {
      logger.debug('error    %s :HTTP status code = %d', url, resp.status);
      return null;
    }
  } catch (error) {
    logger.error("error    %s, %o", url, error, {});
    return null;
  }
}

module.exports = {
  fetch_image_url_to_base64
};
