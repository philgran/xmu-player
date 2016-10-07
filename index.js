var request = require('request');
var cheerio = require('cheerio');
var http = require('http');
var fs = require('fs');
var readJson = require('r-json');
var opn = require('opn');
var Youtube = require('youtube-api');

const PORT = 8080;
const CREDENTIALS = readJson(`${__dirname}/credentials.json`);

var oauth = Youtube.authenticate({
  type: 'oauth',
  client_id: CREDENTIALS.web.client_id,
  client_secret: CREDENTIALS.web.client_secret,
  redirect_url: CREDENTIALS.web.redirect_uris[0]
});

opn(oauth.generateAuthUrl({
  access_type: 'offline',
  scope: 'https://www.googleapis.com/auth/youtube'
}));

function doSearch() {
  oauth.getToken()
}

//We need a function which handles requests and send response
function handleRequest(req, res){
  fs.readFile(__dirname + req.url, function(err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    request({
      uri: 'http://www.dogstarradio.com/search_xm_playlist.php?channel=35'
    }, function(error, response, body){
      return parseSongs(body);
    });
    res.writeHead(200);
    res.end(data);
  });
}

function parseSongs(body) {
  var $page = cheerio.load(body);
  var allRows = $page('body > center > table > tr');
  var tbodyRows = allRows.slice(3, allRows.length-1);

  // If tbody row contains an @ or / assume it is a 
  // twitter handle or URL and filter it out.
  var songRows = tbodyRows.filter(function(index, element){
    var weedout = '@|\/';
    var artist = element.children[1].children[0].data;
    var song = element.children[2].children[0].data;

    if (!artist.match(weedout) || !song.match(weedout)) {
      return element;
    }
  });

  // Extract artist and song then join to form query
  var queries = songRows.map(function(index, row){
    var artist = row.children[1].children[0].data;
    var song = row.children[2].children[0].data;
    return artist + ' ' + song;
  });

  return queries;
}

var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
  //Callback triggered when server is successfully listening. Hurray!
  console.log("Server listening on: http://localhost:%s", PORT);
});

server.listen('/oauth2callback', function(){
  doSearch();
});
