'use strict';

const fs = require('fs');
const {
  urlQueue
} = require('./queues');
const logger = require('./logger');

function startTest() {
  urlQueue.add({
    // url: 'https://www.facebook.com/lemonde.fr'
    url: 'https://lemonde.fr'
    // url: 'http://www.ports-37.com/index.php/8-mairie'
    // url: 'http://www.liberation.fr'
    // url: 'http://www.disneylandparis.com/'
    // url: 'https://medium.com/slack-developer-blog/everything-you-ever-wanted-to-know-about-unfurling-but-were-afraid-to-ask-or-how-to-make-your-e64b4bb9254#.a0wjf4ltt'
    // url: 'https://en.wikipedia.org/wiki/List_of_national_parks_of_the_United_States'

  });
  urlQueue.add({
    end: true
  });
}

function start() {
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

  urlQueue.empty().then(() => {
    fs.createReadStream(__dirname + '/top-100.csv').pipe(csvparser);
  });

  urlQueue.add({
    end: true
  });
}

function add(data) {
  // FIXME : check if url is already in the queue
  urlQueue.add(data);
}

module.exports = {
  start: startTest,
  add: add
}
