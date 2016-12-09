const request = require('request');
const cheerio = require('cheerio');

const PLAYLIST_URL = 'http://www.dogstarradio.com/search_xm_playlist.php?channel=35';

const parseSongs = function(body) {
  const $page = cheerio.load(body);
  const allRows = $page('body > center > table > tr');
  const tbodyRows = allRows.slice(3, allRows.length-1);

  // If tbody row contains an @ or / assume it is a 
  // twitter handle or URL and filter it out.
  const songRows = tbodyRows.filter((index, element) => {
    const weedout = /(@|\/)/;
    const artist = element.children[1].children[0].data;
    const song = element.children[2].children[0].data;

    if (!artist.match(weedout) || !song.match(weedout)) {
      return element;
    }
  });

  // Extract artist and song then join to form query
  const queries = songRows.map((index, row) => {
    const artist = row.children[1].children[0].data;
    const song = row.children[2].children[0].data;
    return artist + ' ' + song;
  });

  return queries;
}

const getPage = function() {
  const promise = new Promise((resolve, reject) => {
    request({
      uri: PLAYLIST_URL
    }, (error, response, body) => {
      if (error) {
        reject(error, response, body);
      } else {
        const queries = parseSongs(body);
        resolve(queries);
      }
    });
  });
  return promise;
}

module.exports = {
  getQueries: function() {
    return getPage();
  }
}


