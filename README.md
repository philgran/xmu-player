# XMU Player

This is a simple node app that generates a playlist of youtube videos from a playlist of songs played on the Sirius
satellite radio station XMU.

## Installing

npm install

## Running

Run node index.js.

### TODO:

* Create a new google/yt account to house the playlists.
* Re-generate oauth tokens/API keys from new account.

#### Input:

Playlist from xmu, xmu show, blog, etc. Ideally XML from RSS feed or similar, probably more like a screen scrape.
* Brooklyn Vegan
* Gorilla vs. Blog
* My Old Kentucky Blog
* Aquarium Drunkard

#### Output:

Youtube playlist of all songs from feed.

#### Steps:

* Download RSS or HTML from web page
* Parse list for artists/tracks
* Use youtube API to:
** Create new youtube playlist
** Search for each artist/track
** Add track to playlist
* Send email or other notification to subscriber (me)
