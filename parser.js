'use strict';

const logger = require('./logger');

const _ = require('lodash');
const htmlmetaparser = require('htmlmetaparser');
const metascraper = require('metascraper')([
  // require('metascraper-author')(),
  // require('metascraper-date')(),
  require('metascraper-description')(),
  // require('metascraper-media-provider')(),
  // require('metascraper-video')(),
  // require('metascraper-audio')(),
  // require('metascraper-image')(),
  require('metascraper-logo')(),
  require('metascraper-logo-favicon')(),
  require('metascraper-clearbit-logo')(),
  require('metascraper-publisher')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
  require('metascraper-lang-detector')(),
  require('metascraper-lang')()
])
const htmlparser = require('htmlparser2');
const { fetch_image_url_to_base64 } = require('./image');
const feed = require('./feed');
const storage = require('./storage');

async function mergemetas(url, metadata, metadata2, data) {
  // mainUrl
  let mainUrl = url;
  if (_.has(data, 'mainUrl')) {
    mainUrl = data.mainUrl;
    metadata['mainUrl'] = data.mainUrl;
  }

  //
  let result = [];

  // alternate
  if (_.has(metadata2, "alternate")) {
    metadata['alternate'] = metadata2['alternate'];
    metadata['alternate'].forEach(alternate => {
      result.push({
        mainUrl: mainUrl,
        url: _.get(alternate, 'href'),
        type: _.get(alternate, 'type'),
        lang: _.get(alternate, 'hreflang'),
        media: _.get(alternate, 'media')
      });
    });
  }

  // sameAs
  metadata['sameAs'] = [];

  // add sameAs, enqueue them
  if (_.has(metadata2, ['jsonld', 'sameAs'])) {
    metadata['sameAs'] = metadata['sameAs'].concat(metadata2['jsonld']['sameAs']);
  }

  // sameAs : facebook page
  const graph = _.get(metadata2, ['rdfa', '@graph']);
  if (Array.isArray(graph)) {
    console.log(graph);
    graph.forEach(graph0 => {
      const fbPage = _.get(graph0, ['fb:pages', '@value']) || _.get(graph0, ['fb:page_id', '@value']);
      if (fbPage) {
        metadata['sameAs'].push('https://www.facebook.com/' + fbPage);
      }
    });
  }

  // @graph twitter:site

  //
  metadata['sameAs'].forEach(sameAsUrl => {
    feed.add({
      url: sameAsUrl,
      end: false,
      mainUrl: mainUrl
    });
  });

  result.push(metadata);

  // redirect
  if (data.url !== metadata.url) {
    result.push({
      url: data.url,
      redirect: metadata.url
    });
  }

  if (data.url !== url && url !== metadata.url) {
    result.push({
      url: url,
      redirect: metadata.url
    });
  }

  // logger.debug(JSON.stringify(metadata2, null, 2));
  logger.debug(JSON.stringify(result, null, 2));

  //
  result.forEach(r => {
    storage.storeUrl(r);
  });
}

async function parseHtml(url, html, data) {
  // metascaper
  let metadata = await metascraper({
    html,
    url
  });

  //
  if (metadata.logo !== null) {
    metadata.logoBase64 = await fetch_image_url_to_base64(metadata.logo);
  }

  // htmlmetaparser
  const handler = new htmlmetaparser.Handler(
    function(err, result) {
      logger.debug('parsed   %s %s', url, err);
      if (err === null) {
        mergemetas(url, metadata, result, data);
      } else {
        mergemetas(url, metadata, {}, data);
      }
    }, {
      url: url // The HTML pages URL is used to resolve relative URLs.
    }
  );

  const parser = new htmlparser.Parser(handler, {
    decodeEntities: true
  });
  parser.write(html);
  parser.done();
}

module.exports = {
  parseHtml
}
