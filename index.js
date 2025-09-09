const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const readJson = require('r-json');
const Lien = require('lien');
const opn = require('opn');
const Youtube = require('youtube-api');
const moment = require('moment');

const CREDENTIALS = readJson(`${__dirname}/credentials.json`);
const PLAYLIST_URL = 'https://xmplaylist.com/station/siriusxmu';

let server = new Lien({
  host: 'localhost',
  port: 8080
});

let oauth = Youtube.authenticate({
  type: 'oauth',
  client_id: CREDENTIALS.web.client_id,
  client_secret: CREDENTIALS.web.client_secret,
  redirect_url: CREDENTIALS.web.redirect_uris[0]
});

opn(oauth.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/youtube']
}));

server.addPage('/oauth2callback', lien => {
  oauth.getToken(lien.query.code, (err, tokens) => {

    if (err) {
      console.log(JSON.stringify(err));
      return;
    }

    oauth.setCredentials(tokens);

    // Applicattion flow
    request({
      uri: PLAYLIST_URL
    }, (error, response, body) => {
      let pid,
          cid,
          runningSearches = [],
          runningAdditions = [];

      const queries = parseSongs(body);
      let names = [];
      queries.each((index, query) => {
        names.push(query);
      });
      const description = names.join('\n');
      const playlist = createPlaylist(description).then(playlistResponse => {
        pid = playlistResponse.id;
        cid = playlistResponse.snippet.channelId;

        // Search for videos and compile list of video ids
        queries.each((index, query) => {
          // Add findResult promise to the search queries array
          runningSearches.push(findResult(query));
        });

        Promise.all(runningSearches).then(values => {
          // Filter out false values from empty responses
          values = values.filter(Boolean);
          
          const additionPromises = values.map(vid => addResultToPlaylist(vid, pid, cid));
          
          Promise.all(additionPromises).then(results => {
            console.log(`Successfully added ${results.length} videos to playlist ${pid}`);
          }).catch(error => {
            console.error('Error adding videos to playlist:', error);
          });
        }, reason => {
          console.log('rejected:', reason);
        });

      });
    });

    // Returning here to see if that lets the OAuth call finish
    return;
  });

  // Returning here to see if that lets the OAuth call finish
  return;
});

function addResultToPlaylist(vid, pid, cid) {
  console.log(`Adding ${vid} to ${pid} on channel ${cid}`);
  return new Promise((resolve, reject) => {
    Youtube.playlistItems.insert({
      part: 'snippet',
      resource: {
        snippet: {
          playlistId: pid,
          playlistTitle: 'XMU Playlist',
          resourceId: {
            kind: 'youtube#video',
            videoId: vid
          }
        }
      }
    }, (err, response, msg) => {
      if (err) {
        console.error(`Failed to add video ${vid}:`, err);
        reject(err);
      } else {
        console.log(`Successfully added video ${vid} to playlist`);
        resolve(response);
      }
    });
  });
}

function findResult(query) {
  const searchPromise = new Promise((resolve, reject) => {
    Youtube.search.list({
      part: 'snippet',
      maxResults: 1,
      q: query,
      type: 'video'
    }, (err, response, msg) => {
      if (err) {
        reject(err);
      } else {
        // Return if there are no results in the items array
        if (response.items.length === 0) {
          resolve(false);
          return;
        }
        // Otherwise return the video id
        const videoId = response.items[0].id.videoId;
        resolve(videoId);
      }
    });
  });
  return searchPromise;
}

function createPlaylist(description) {
  const now = moment(new Date()).format('MMM Do YYYY');
  const title = `XMU Playlist ${now}`;
  const playlistPromise = new Promise((resolve, reject) => {
    Youtube.playlists.insert({
      part: 'snippet,status',
      resource: {
        snippet: {
          title: title,
          description: description
        },
        status: {
          privacyStatus: 'private'
        }
      }
    }, (err, response, msg) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Created ${title}.`);
        resolve(response);
      }
    });
  });
  return playlistPromise;
}

function parseSongs(body) {
  const $page = cheerio.load(body);
  
  const songTitles = $page('h3');
  
  const queries = [];
  
  songTitles.each((index, element) => {
    const $element = $page(element);
    const songTitle = $element.text().trim();
    
    const $artistList = $element.next('ul');
    
    if ($artistList.length > 0) {
      const artists = [];
      $artistList.find('li').each((i, artistElement) => {
        const artistName = $page(artistElement).text().trim();
        if (artistName) {
          artists.push(artistName);
        }
      });
      
      const artistString = artists.join(' ');
      
      if (artistString && songTitle) {
        queries.push(artistString + ' ' + songTitle);
      }
    }
  });
  
  const $queries = $page('<div>');
  queries.forEach(query => {
    $queries.append($page('<span>').text(query));
  });
  
  return $queries.children();
}
