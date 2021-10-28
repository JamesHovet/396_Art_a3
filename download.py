import lyricsgenius
import time
import os
import pathlib

genius = lyricsgenius.Genius("ihSSN2XhKiYdy9s-fk13_MTSpEXjC9EZr__qOC4n9XDUTuOarb6EYJHOMp5arv7-DE3PN0h8P9w8L4o9o6Coqw")

album_titles = [
   'Please Please Me',
   'With the Beatles',
   "A Hard Days Night US",
   'Beatles for Sale',
   'Help',
   'Rubber Soul',
   'Revolver',
   'Magical Mystery Tour',
   'The Beatles The White Album',
   'Yellow Submarine',
   'Abbey Road',
   'Let It Be',
]

pathlib.Path('./data_source').mkdir(exist_ok=True)
os.chdir("./data_source")
current_dir_files = os.listdir()

for album_title in album_titles:
    if not album_title + ".json" in current_dir_files:
        print("Saving", album_title)
        album = genius.search_album(album_title, "The Beatles")
        album.save_lyrics(album_title)
        time.sleep(10) ## rate limiting 


## Sgt. Pepper wasn't showing up in search, so I hacked it in
album = genius.search_album(album_id=11039, artist="The Beatles")
album.save_lyrics("Sgt.PeppersLonelyHeartsClubBand")
