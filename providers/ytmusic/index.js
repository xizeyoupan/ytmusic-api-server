import { set_cache } from "../../util.js"
import util from 'util'
import child_process from 'child_process'
import path from 'path'
const __dirname = path.resolve()

const exec = util.promisify(child_process.exec)

const handle = async (type, id, myCache, cookie = '') => {
    let data = myCache.get(id)
    let result

    if (type !== 'playlist') {
        if (!data) {
            const cmd = `poetry run python ${__dirname}/api.py song ${id}`
            console.log(cmd)
            const { stdout, stderr } = await exec(cmd)
            console.log(stdout)
            data = JSON.parse(stdout)
            set_cache(myCache, data)
            data = data[0]
        }
        result = [data]
    }

    switch (type) {
        case 'playlist':
            if (!data) {
                const cmd = `poetry run python ${__dirname}/api.py playlist ${id}`
                console.log(cmd)
                const { stdout, stderr } = await exec(cmd)
                data = JSON.parse(stdout)
                data = data.filter(i => i.id)
                set_cache(myCache, data)
                myCache.set(id, data)
            }
            result = data
            break
        case 'url':
            const cmd = `poetry run python -m yt_dlp --get-url -f ba https://youtube.com/watch?v=${id}`
            console.log(cmd)
            const { stdout, stderr } = await exec(cmd)
            const url = stdout
            result = url
            break
        case 'lrc':
            let lrc = data.lrc
            if (!lrc) {
                const cmd = `poetry run python -m syncedlyrics_aio "${data.title + ' ' + data.author}" -d ${data.duration} -m 20000 -p "NetEase" "Tencent"`
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
        ctx.register('ytmusic', { handle })
    }
}
