import util from 'util'
import child_process from 'child_process'
import path from 'path'
import { Readable } from 'stream'
import Koa from 'koa'
import Router from '@koa/router'
import logger from 'koa-logger'
import cors from '@koa/cors'
import NodeCache from "node-cache"
import ytdl from 'whatis-core'


const __dirname = path.resolve()
const exec = util.promisify(child_process.exec)

const myCache = new NodeCache({ stdTTL: 60 * 60 * 12, checkperiod: 60 * 60 })
const urlCache = new NodeCache({ stdTTL: 60 * 20, checkperiod: 60 * 15 })

const app = new Koa({ proxy: true })
const router = new Router()

const set_cache = (songs) => {
    songs.map(song => {
        myCache.set(song.id, song)
    })
}

const cache_single_song = async (id) => {
    const { stdout, stderr } = await exec(`python ${__dirname}/api.py song ${id}`)
    console.log(stdout)
    const data = JSON.parse(stdout)
    set_cache(data)
    return data[0]
}

const wrap_url = (origin, song) => {
    song.pic = `${origin}/api?&type=pic&id=${song.id}`
    song.url = `${origin}/api?&type=url&id=${song.id}`
    song.lrc = `${origin}/api?&type=lrc&id=${song.id}`
    return song
}

router
    // .head(/.*/, ctx => ctx.status = 405)
    .get('/api', async (ctx, next) => {
        const query = ctx.request.query
        const type = query.type
        const id = query.id
        const origin = ctx.request.origin

        let data = myCache.get(id)
        switch (type) {
            case 'song':
                if (!data) data = await cache_single_song(id)
                data = wrap_url(origin, data)
                ctx.body = [data]
                break
            case 'playlist':
                if (!data) {
                    const { stdout, stderr } = await exec(`python ${__dirname}/api.py playlist ${id}`)
                    console.log(stdout)
                    data = JSON.parse(stdout)
                    data = data.filter(i => i.id)
                    set_cache(data)

                    const ids = data.map(song => song.id)
                    myCache.set(id, ids)
                } else {
                    data = data.map(_id => myCache.get(_id))
                }
                data = data.map(song => wrap_url(origin, song))
                ctx.body = data
                break

            case 'pic':
                if (!data) data = await cache_single_song(id)
                const response = await fetch(data.pic)
                ctx.type = response.headers.get("Content-Type")
                ctx.body = Readable.fromWeb(response.body)
                break
            case 'url':
                let url = urlCache.get(id)
                if (!url) {
                    const info = await ytdl.getInfo(id)
                    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
                    url = format.url
                    urlCache.set(id, url)
                    console.log(url)
                }

                // let req_h = ctx.req.headers
                // req_h.host = new URL(url).host
                // delete req_h.connection
                // const r = await fetch(url, { headers: req_h })
                // const res_h = Object.fromEntries(r.headers.entries())
                // ctx.set(res_h)
                // ctx.body = Readable.fromWeb(r.body)

                url = new URL(url)
                const self_upstream = url.hostname + ':443'
                const self_path = url.pathname
                const search = url.search + '&self_upstream=' + self_upstream + '&self_path=' + self_path
                ctx.redirect(`${origin}/proxy` + search)
                break
            case 'lrc':
                ctx.body = ''
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

app.listen(3333, '0.0.0.0')
