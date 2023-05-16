export const set_cache = (myCache, songs, playlistId = '') => {

    if (playlistId) myCache.set(playlistId, songs)

    songs.map(song => {
        myCache.set(song.id, song)
    })
}
