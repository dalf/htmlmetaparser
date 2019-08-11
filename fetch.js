const logger = require('./logger');

const got = require('got');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:65.0) Gecko/20100101 Firefox/65.0';

const got_logo_options = {
  // These properties are part of the Fetch Standard
  method: 'GET',
  headers: {
    'Accept': '*/*',
    'Accept-Language': 'en-US;q=0.8,en;q=0.7',
    'User-Agent' : userAgent
  },
  timeout: 20000,
  retry: 2,
  followRedirect: true,
  decompress: true,
  agent: userAgent
};

const got_html_options = {
  // These properties are part of the Fetch Standard
  method: 'GET',
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml,application/json',
    'Accept-Language': 'en-US;q=0.8,en;q=0.7',
    'User-Agent' : userAgent
  },
  timeout: 20000,
  retry: 2,
  followRedirect: true,
  decompress: true,
  agent: userAgent
};

module.exports = {
  got,
  got_logo_options,
  got_html_options
}
