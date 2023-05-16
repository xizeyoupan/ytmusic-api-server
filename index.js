import util from 'util'
import child_process from 'child_process'
import { Readable } from 'stream'
import Koa from 'koa'
import Router from '@koa/router'
import logger from 'koa-logger'
import cors from '@koa/cors'
import NodeCache from "node-cache"
import Providers from "./providers/index.js"

const exec = util.promisify(child_process.exec)

const myCache = new NodeCache({ stdTTL: 60 * 60 * 3, checkperiod: 60 * 60 })

const app = new Koa({ proxy: true })
const router = new Router()

const p = new Providers()

const wrap_url = (server, origin, song) => {
    song.pic = `${origin}/api?server=${server}&type=pic&id=${song.id}`
    song.url = `${origin}/api?server=${server}&type=url&id=${song.id}`
    song.lrc = `${origin}/api?server=${server}&type=lrc&id=${song.id}`
    return song
}

let { stdout, stderr } = await exec(`pip3 list`)
console.log(stdout)

if (!stdout.includes('yt-dlp')) {
    stdout = (await exec(`pip3 install yt-dlp`)).stdout
    console.log(stdout)
}

if (!stdout.includes('spotdl')) {
    stdout = (await exec(`pip3 install spotdl`)).stdout
    console.log(stdout)
}

router
    // .head(/.*/, ctx => ctx.status = 405)
    .get('/api', async (ctx, next) => {
        const query = ctx.request.query
        const server = query.server
        const type = query.type
        const id = query.id
        const origin = ctx.request.origin

        let data = await p.get(server).handle(type, id, myCache)

        console.log(data)

        switch (type) {
            case 'song':
                ctx.body = [wrap_url(server, origin, data[0])]
                break
            case 'playlist':
                data = data.map(song => wrap_url(server, origin, song))
                ctx.body = data
                break
            case 'pic':
                const response = await fetch(data)
                ctx.type = response.headers.get("Content-Type")
                ctx.body = Readable.fromWeb(response.body)
                break
            case 'url':
                let url = new URL(data)
                const self_upstream = url.hostname + ':443'
                const self_path = url.pathname
                const search = url.search + '&self_upstream=' + self_upstream + '&self_path=' + self_path
                ctx.redirect(`${origin}/proxy` + search)
                break
            case 'lrc':
                ctx.body = data
                break
            default:
                break
        }
    })

app
    .use(cors())
    .use(logger())
    .use(router.routes())
    .use(router.allowedMethods())

console.log(`start listen on 0.0.0.0:3333`)
app.listen(3333, '0.0.0.0')
