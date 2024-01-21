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
            sourceType: 'module' // 解析文件的模块化方案是 ES Module
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
            // 内部会遍历ast中program.body，判断里面语句类型
            // 如果 type：ImportDeclaration 就会触发当前函数
            ImportDeclaration({ node }) {
                // 文件相对路径：'./add.js'
                const relativePath = node.source.value
                // 生成基于入口文件的绝对路径
                const absolutePath = path.resolve(dirname, relativePath)
                // 添加依赖
                deps[relativePath] = absolutePath
            }
        })
        return deps
    },
    // babel ats转换
    // 将ast解析成code
    getCode(ast) {
        const { code } = transformFromAst(ast,null,{
            presets: ['@babel/preset-env']
        })
        return code
    },
}
