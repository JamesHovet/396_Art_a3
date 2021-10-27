import os
import json
import re

out = []

prefix = "./data_source"

def main():
	for filepath in os.listdir(prefix):
		with open(prefix + "/" + filepath) as f:
			d = json.load(f)
			albumname = d["name"]
			year = d["release_date_components"]["year"]
			tracks = [pruneTrack(track) for track in d["tracks"] if track["song"]["instrumental"] == False]
			
			for track in tracks:
				track["album"] = albumname
				track["year"] = year
				out.append(track)

			

	with open("extracted.json", mode='w') as f:
		json.dump(out, f)
	
	with open("extracted.js", mode='w') as f:
		f.write("var tracks = ")
		json.dump(out, f)

def pruneTrack(track):
	out = {}
	
	song = track["song"]
	out["title"] = song["title"]
	out["lyrics"] = trimLyrics(song["lyrics"])

	return out

def trimLyrics(lyrics: str) -> str:
	lines = [line for line in lyrics.split("\n")]
	bracketsRemoved = [re.sub(r'\[.+\]', '', line) for line in lines]
	unwantedRemoved = [re.sub(r'[\(\)\"\,\!\.\“\”]', '', line) for line in bracketsRemoved]
	noEmptyLines = [line for line in unwantedRemoved if len(line) > 0]
	lowercase = [line.lower() for line in noEmptyLines]

	return "\n".join(lowercase[:-1]) ## take out last line, seems to always have some weird non-lyrics content



if __name__ == "__main__":
	main()
