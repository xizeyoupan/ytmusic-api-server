import spotify from './spotify/index.js'
import ytmusic from './ytmusic/index.js'

class Providers {

    constructor() {
        this.providers = {}

        ytmusic.register(this)
        spotify.register(this)

    }

    register(provider_name, handle_obj) {
        this.providers[provider_name] = handle_obj
    }

    get(provider_name) {
        return this.providers[provider_name];
    }

    get_provider_list() {
        return Object.keys(this.providers)
    }
}

export default Providers
