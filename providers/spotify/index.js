import { set_cache } from "../../util.js"
import util from 'util'
import fs from 'fs'
import child_process from 'child_process'
import path from 'path'
const __dirname = path.resolve()

const exec = util.promisify(child_process.exec)

const handle = async (type, id, myCache, cookie = '') => {
    let data = myCache.get(id)
    let result

    if (type !== 'playlist') {
        if (!data) {
            const cmd = `python -m spotdl save https://open.spotify.com/track/${id}  --save-file ${__dirname}/list.spotdl`
            console.log(cmd)
            const { stdout, stderr } = await exec(cmd)
            console.log(stdout)

            data = fs.readFileSync(`${__dirname}/list.spotdl`)
            data = JSON.parse(data)
            fs.unlinkSync(`${__dirname}/list.spotdl`)

            data = data.map(song => ({
                author: song.artist,
                pic: song.cover_url,
                id: song.song_id,
                song_url: song.url,
                title: song.name
            }))

            set_cache(myCache, data)
            data = data[0]
        }
        result = [data]
    }

    switch (type) {
        case 'playlist':
            if (!data) {
                const cmd = `python -m spotdl save https://open.spotify.com/playlist/${id}  --save-file ${__dirname}/list.spotdl`
                console.log(cmd)
                const { stdout, stderr } = await exec(cmd)
                console.log(stdout)
                data = fs.readFileSync(`${__dirname}/list.spotdl`)
                data = JSON.parse(data)
                fs.unlinkSync(`${__dirname}/list.spotdl`)

                data = data.map(song => ({
                    author: song.artist,
                    pic: song.cover_url,
                    id: song.song_id,
                    song_url: song.url,
                    title: song.name
                }))
                data = data.filter(i => i.id)
                set_cache(myCache, data)
                myCache.set(id, data)
            }
            result = data
            break
        case 'url':
            const cmd = `python -m spotdl url https://open.spotify.com/track/${id}`
            console.log(cmd)
            const { stdout, stderr } = await exec(cmd)
            const url = stdout.split('\n').reverse()[2]
            result = url
            break
        case 'lrc':
            let lrc = data.lrc
            if (!lrc) {
                const cmd = `python ${__dirname}/api.py lyrics "${data.title + ' ' + data.author}"`
                console.log(cmd)
                const { stdout, stderr } = await exec(cmd)
                lrc = stdout
                data.lrc = lrc
                myCache.set(id, data)
            }
            result = lrc
            break
        case 'pic':
            result = data.pic
            break
        default:
            break
    }

    return result
}

export default {
    register: (ctx) => {
        ctx.register('spotify', { handle })
    }
}
