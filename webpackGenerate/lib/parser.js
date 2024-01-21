const fs = require('fs')
const path = require('path')

const babelParser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { transformFromAst } = require('@babel/core')

module.exports = {
    // 获取babelParser编译的ast
    // sourceType:module 代表要解析模块化规范是es module类型,否则默认为commonjs类型
    getAst(filePath) {
        const file = fs.readFileSync(filePath,'utf-8')
        const ast = babelParser.parse(file, {
            sourceType: 'module'
        })
        return ast
    },
    // 获取依赖deps
    /*"deps": {
        "./add.js": "C:\\Users\\mj\\Desktop\\webpack5\\code\\webpackGenerate\\src\\add.js",
        "./count.js": "C:\\Users\\mj\\Desktop\\webpack5\\code\\webpackGenerate\\src\\count.js"
    }*/
    getDeps(ast, filePath) {
        const dirname = path.dirname(filePath)
        const deps = {}
        traverse(ast, {
            ImportDeclaration({ node }) {
                const relativePath = node.source.value
                const absolutePath = path.resolve(dirname, relativePath)
                deps[relativePath] = absolutePath
            }
        })
        return deps
    },
    // babel ats转换
    getCode(ast) {
        const { code } = transformFromAst(ast,null,{
            presets: ['@babel/preset-env']
        })
        return code
    },
}
