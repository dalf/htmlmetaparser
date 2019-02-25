const winston = require('winston');
const fs = require('fs');
const {
  setup,
  fetch,
  disconnect,
  disconnectAll,
  AbortController
} = require('fetch-h2');
const {
  brDecode
} = require('fetch-h2-br');
const htmlmetaparser = require('htmlmetaparser');
const metascraper = require('metascraper')([
  require('metascraper-author')(),
  require('metascraper-date')(),
  require('metascraper-description')(),
  // require('metascraper-media-provider')(),
  require('metascraper-video')(),
  require('metascraper-audio')(),
  require('metascraper-image')(),
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
const csvparse = require('csv-parse');
const Queue = require('bull');
const b64toBuff = require('base64-arraybuffer');
const icoToPng = require('ico-to-png');
const fileType = require('file-type');

const icoMimeType = new Set(['image/vnd.microsoft.icon', 'image/x-icon', 'image/ico', 'image/icon', 'text/ico', 'application/ico']);

// logger
const enumerateErrorFormat = winston.format(info => {
  if (info.message instanceof Error) {
    info.message = Object.assign({
      message: info.message.message,
      stack: info.message.stack
    }, info.message);
  }

  if (info instanceof Error) {
    return Object.assign({
      message: info.message,
      stack: info.stack
    }, info);
  }

  return info;
});

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({
      stack: true
    })
  )
});

// logger for not production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.splat(),
      // enumerateErrorFormat,
      // winston.format.simple()
      winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    )
  }));
}

// fetch-h2-br : Setup only once to avoid undefined behavior
setup({
  decoders: [brDecode()],
  overwriteUserAgent: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:65.0) Gecko/20100101 Firefox/65.0'
});

const fetch_logo_options = {
  // These properties are part of the Fetch Standard
  method: 'GET',
  redirect: 'follow', // set to `manual` to extract redirect headers, `error` to reject redirect
  headers: {
    'Accept' : '*/*',
    'Accept-Language': 'en-US;q=0.8,en;q=0.7'
  },
  timeout: 20000,
  // The following properties are node-fetch extensions
  follow: 20, // maximum redirect count. 0 to not follow redirect
  compress: true, // support gzip/deflate content encoding. false to disable
  size: 1000000, // maximum response body size in bytes. 0 to disable
  allowForbiddenHeaders: true
};

const options = {
  // These properties are part of the Fetch Standard
  method: 'GET',
  redirect: 'follow', // set to `manual` to extract redirect headers, `error` to reject redirect
  headers: {
    'Accept' : 'text/html,application/xhtml+xml,application/xml,application/json',
    'Accept-Language': 'en-US;q=0.8,en;q=0.7'
  },
  timeout: 20000,
  // The following properties are node-fetch extensions
  follow: 20, // maximum redirect count. 0 to not follow redirect
  compress: true, // support gzip/deflate content encoding. false to disable
  size: 0, // maximum response body size in bytes. 0 to disable
  allowForbiddenHeaders: true
};


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

async function fetch_url_to_base64(url) {
  logger.info('fetching %s', url);
  try {
    const resp = await fetch(url, fetch_logo_options);
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

//const url = 'https://medium.com/slack-developer-blog/everything-you-ever-wanted-to-know-about-unfurling-but-were-afraid-to-ask-or-how-to-make-your-e64b4bb9254#.a0wjf4ltt'
// const url = 'https://en.wikipedia.org/wiki/List_of_national_parks_of_the_United_States'
async function parsemeta(url, html) {
  // htmlmetaparser
  const handler = new htmlmetaparser.Handler(
    function(err, result) {
      logger.debug('parsed   %s %s', url, err);
      if (err === null) {
        // logger.debug(JSON.stringify(result, null, 2));
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

  // metascaper
  let metadata = await metascraper({
    html,
    url
  });

  //
  if (metadata.logo !== null) {
    metadata.logoBase64 = await fetch_url_to_base64(metadata.logo);
  }

  //
  logger.debug(JSON.stringify(metadata, null, 2));
}

async function crawl_url(url) {
  logger.info("fetching %s", url, {});
  try {
    const resp = await fetch(url, options);
    logger.debug('fetched  %s HTTP%d %s', url, resp.httpVersion, ', ', resp._mime);
    if (resp.status !== 200) {
      logger.debug('error    %s :HTTP status code = %d', url, resp.status);
    } else {
      const html = await resp.text();
      await parsemeta(resp.url, html);
      await disconnect(url);
      logger.debug('done     %s', url);
    }
  } catch (error) {
    logger.error('error    %s, %o', url, error);
  }
}

const urlQueue = new Queue('url', 'redis://127.0.0.1:6379');

//
/*
urlQueue.add({
  url: 'http://www.ports-37.com/index.php/8-mairie'
});
*/
urlQueue.add({
  url: 'http://lemonde.fr'
});
/*
urlQueue.add({
  end: true
});
*/

// Add all URL from Alexa top*
const csvparser = csvparse({
  delimiter: ','
});

csvparser.on('readable', function() {
  let record
  while (record = csvparser.read()) {
    const url = 'http://' + record[1];
    urlQueue.add({
      url: url,
      end: false
    });
  }
});

csvparser.on('end', function() {
  urlQueue.add({
    end: true
  });
});

/*
urlQueue.empty().then(() => {
  fs.createReadStream(__dirname + '/top-100.csv').pipe(csvparser);
});
*/

// Process
urlQueue.process(30, async (job) => {
  if (job.data.end === true) {
    logger.info("closing");
  } else {
    return crawl_url(job.data.url);
  }
});

urlQueue.on('drained', function() {
  urlQueue.close().then(function() {
    logger.info('done urlQueue.close()')
  });
  /*
  disconnectAll().then(() => {
    logger.info('done disconnectAll()');
  });
  */
});
