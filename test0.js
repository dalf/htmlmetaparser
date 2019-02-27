'use strict';

const parser = require('./parser')
const feed = require('./feed');
const processor = require('./processor');

feed.start();
processor.start(parser.parseHtml);
