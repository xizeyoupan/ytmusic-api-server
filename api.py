
import argparse
import json
import os
import time
from functools import cache
from io import BytesIO

# import requests
# from yt_dlp import YoutubeDL
from ytmusicapi import YTMusic

currentPath = os.path.dirname(os.path.realpath(__file__))

yt = YTMusic(language="zh_CN")
parser = argparse.ArgumentParser()


def get_playlist(id):
    playlist = yt.get_playlist(id)

    res = []
    for song in playlist['tracks']:
        _ = {}
        _['id'] = song['videoId']
        artists = ''
        for artist in song['artists']:
            if artist['name'] == song['artists'][-1]['name']:
                artists += artist['name']
            else:
                artists += artist['name'] + ' / '
        _['author'] = artists
        _['title'] = song['title']
        _['duration'] = int(song['duration_seconds']) * 1000
        _['pic'] = song['thumbnails'][-1]['url']
        res.append(_)
    return json.dumps(res)


# def get_song_info(id):
#     song = yt.get_song(id)
#     return song


def get_single_song(id):
    info = yt.get_song(id)
    _ = {'id': id}
    _['duration'] = int(info['videoDetails']['lengthSeconds']) * 1000
    _['author'] = info['videoDetails']['author']
    _['title'] = info['videoDetails']['title']
    _['pic'] = info['videoDetails']['thumbnail']['thumbnails'][-1]['url']
    return json.dumps([_])


# def get_pic(id):
#     info = get_song_info(id)
#     url = info['videoDetails']['thumbnail']['thumbnails'][-1]['url']
#     r = requests.get(url)
#     type = r.headers['content-type']
#     return BytesIO(r.content), type


# def get_url(id):
#     timestamp = str(int(time.time()))
#     filename = '%(id)s_' + timestamp
#     ctx = {
#         "outtmpl": os.path.join(currentPath, 'temp', filename),
#         'logtostderr': True,
#         'format': 'bestaudio/best',
#     }
#     with YoutubeDL(ctx) as ytdl:
#         ytdl.download(['https://www.youtube.com/watch?v='+id])
#     return id + '_' + timestamp


# res = get_playlist("PLEqSd0CstNysjgFMnQCXoaJg9MtroKfGg")
# res = get_single_song("U8E3j6y__BA")
# print(res)


parser.add_argument('type', type=str)
parser.add_argument('id', type=str)
args = parser.parse_args()

if args.type == 'playlist':
    print(get_playlist(args.id))
elif args.type == 'song':
    print(get_single_song(args.id))
