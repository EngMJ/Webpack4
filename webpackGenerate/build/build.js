const config = require('../webpack.config.js')
const myWebpack = require('../lib/index.js')
const build = new myWebpack(config)
build.run()
