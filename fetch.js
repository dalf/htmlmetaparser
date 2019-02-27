const logger = require('./logger');

const {
  setup,
  fetch,
  disconnect,
  disconnectAll,
  AbortController,
  CookieJar
} = require('fetch-h2');
const {
  brDecode
} = require('fetch-h2-br');

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
    'Accept': '*/*',
    'Accept-Language': 'en-US;q=0.8,en;q=0.7'
  },
  timeout: 20000,
  // The following properties are node-fetch extensions
  follow: 20, // maximum redirect count. 0 to not follow redirect
  compress: true, // support gzip/deflate content encoding. false to disable
  size: 1000000, // maximum response body size in bytes. 0 to disable
  allowForbiddenHeaders: true
};

const fetch_html_options = {
  // These properties are part of the Fetch Standard
  method: 'GET',
  redirect: 'follow', // set to `manual` to extract redirect headers, `error` to reject redirect
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml,application/json',
    'Accept-Language': 'en-US;q=0.8,en;q=0.7'
  },
  timeout: 20000,
  // The following properties are node-fetch extensions
  follow: 20, // maximum redirect count. 0 to not follow redirect
  compress: true, // support gzip/deflate content encoding. false to disable
  size: 0, // maximum response body size in bytes. 0 to disable
  allowForbiddenHeaders: true
};

module.exports = {
  fetch,
  disconnect,
  disconnectAll,
  AbortController,
  CookieJar,
  fetch_logo_options,
  fetch_html_options
}
