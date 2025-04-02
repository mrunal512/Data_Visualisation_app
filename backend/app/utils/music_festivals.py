# backend/app/utils/music_festivals.py
import json
import os

def load_music_festivals():
    path = os.path.join(os.path.dirname(__file__), "music_festivals.json")
    with open(path, "r") as f:
        return json.load(f)
