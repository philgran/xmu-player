h4. Input:

Playlist from xmu, xmu show, blog, etc. Ideally XML from RSS feed or similar, probably more like a screen scrape.
* Brooklyn Vegan
* Gorilla vs. Blog
* My Old Kentucky Blog

h4. Output:

Youtube playlist of all songs from feed.

h4. Steps:

* Download RSS or HTML from web page
* Parse list for artists/tracks
* Use youtube API to:
** Create new youtube playlist
** Search for each artist/track
** Add track to playlist
* Send email or other notification to subscriber (me)