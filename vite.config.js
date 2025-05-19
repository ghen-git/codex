/** @type {import('vite').UserConfig} */
import mkcert from 'vite-plugin-mkcert'

export default {
    assetsInclude: ['**/*.ttf'],
    plugins: [ mkcert() ]
}