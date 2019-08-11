'use strict';

const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone X'];

let browser;
const blockedResourceType = new Set([
  // 'document',
  'stylesheet',
  'image',
  'media',
  'font',
  // 'script',
  'texttrack',
  // 'xhr',
  // 'fetch',
  'eventsource',
  'websocket',
  // 'manifest',
  'other'
]);

(async () => {
  const ublockPathExtension = __dirname + '/cjpalhdlnbpafiamejdnhcphjbkeiagm';

  browser = await puppeteer.launch({
    headless: true,
    /*
    args: [
      `--load-extension=${ublockPathExtension}`
    ]
    */
  });
})();


async function fetch(url) {
  try {
    let err = null;
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    // await page.emulate(iPhone);

    await page.setRequestInterception(true);
    page.on('request', request => {
      if (blockedResourceType.has(request.resourceType()))
        return request.abort();
      else
        return request.continue();
    });
    page.on("error", error => {
      err = error;
    });
    const response = await page.goto(url, {
      waitUntil: 'networkidle2'
    });

    let content;
    try {
      content = await page.content();
    } catch (err) {
      console.log("second try after this error:", err);
      content = await page.content();
    }

    await page.close();
    await context.close();

    return {
      url: response.url(),
      statusCode: response.status(),
      ok: response.ok(),
      content: content,
      err: err
    }
  } catch (err) {
    return {
      url: url,
      statusCode: -1,
      ok: false,
      content: null,
      err: err
    }
  }
}

module.exports = {
  fetch: fetch
}
