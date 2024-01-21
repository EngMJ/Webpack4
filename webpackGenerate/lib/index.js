const compiler = require('./compiler.js')
module.exports=function(config) {
    return new compiler(config)
}
