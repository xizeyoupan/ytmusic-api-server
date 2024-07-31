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
            const cmd = `poetry run python -m spotdl save https://open.spotify.com/track/${id}  --save-file ${__dirname}/list.spotdl`
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
                title: song.name,
                duration: song.duration * 1000
            }))

            set_cache(myCache, data)
            data = data[0]
        }
        result = [data]
    }

    switch (type) {
        case 'playlist':
            if (!data) {
                const cmd = `poetry run python -m spotdl save https://open.spotify.com/playlist/${id}  --save-file ${__dirname}/list.spotdl`
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
                    title: song.name,
                    duration: song.duration
                }))
                data = data.filter(i => i.id)
                set_cache(myCache, data)
                myCache.set(id, data)
            }
            result = data
            break
        case 'url':
            let cmd = `poetry run python -m spotdl url https://open.spotify.com/track/${id}`
            console.log(cmd)
            let { stdout, stderr } = await exec(cmd)
            let output = stdout.split('\n')
            console.log(output)
            let url = output.reverse()[2]

            if (!url.startsWith('http')) {
                // not match
                cmd = `poetry run python -m yt_dlp ytsearch1:"${data.title.replaceAll('"', "'")} ${data.author.replaceAll('"', "'")}" --get-url -f ba`
                console.log(cmd)
                let { stdout, stderr } = await exec(cmd)
                output = stdout.split('\n')
                console.log(output)
                url = output[0]
            }
            result = url
            break
        case 'lrc':
            let lrc = data.lrc
            if (!lrc) {
                const cmd = `poetry run python -m syncedlyrics_aio "${data.title.replaceAll('"', "'")} ${data.author.replaceAll('"', "'")}" -d ${data.duration} -m 20000 -p "NetEase Tencent"`
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
