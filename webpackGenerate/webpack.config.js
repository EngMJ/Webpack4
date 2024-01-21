const path = require('path')
module.exports = {
    entry: './src/index.js',
    output: {
        fileName: 'main.js',
        path: path.resolve(__dirname,'dist')
    }
}
