const path = require('path')
const fs = require('fs')
const { getAst,getDeps,getCode } = require('./parser')

class compiler{
    constructor(options = {}) {
        // webpack配置
        this.options = options
        // 所有依赖的容器
        this.modules = []
    }
    run() {
        const entryPath = path.resolve(process.cwd(),this.options.entry)
        // 递归获取所有依赖关系图
        this.getModules(entryPath)
        // 初始化关系依赖图
        const depsGraph = this.modules.reduce((graph, module) => {
          return {
              ...graph,
              [module.absolutePath]:{
                  code: module.code,
                  deps: module.deps
              }
          }
        }, {})
        this.generate(depsGraph)
    }

    // 收集依赖
    getModules(absolutePath) {
        // 递归方法
        // const module = this.build(absolutePath)
        // const { deps } = module
        // this.modules.push(module)
        // for(let relativePath in deps) {
        //     this.getModules(deps[relativePath])
        // }
        // 非递归方法
        const temp = [this.build(absolutePath)]
        for (let i = 0; i < temp.length; i++) {
            const deps = temp[i].deps
            if (deps) {
                for (const relativePath in deps) {
                    if (deps.hasOwnProperty(relativePath)) {
                        temp.push(this.build(deps[relativePath]))
                    }
                }
            }
        }
        /* 待定?
          {
            '绝对路径/index.js': {
              code: 'xxx',
              deps: { 'add.js': "xxx" }
            },
            '绝对路径/add.js': {
              code: 'xxx',
              deps: {}
            }
          }
        */
        this.modules = temp
    }

    // 获取单模块信息
    build(absolutePath) {
        // 获取babelParser编译的ast
        // sourceType:module
        // es module类型的ast语法树
        const ast = getAst(absolutePath)
        // 获取依赖deps
        /*"deps": {
            "./add.js": "C:\\Users\\mj\\Desktop\\webpack5\\code\\webpackGenerate\\src\\add.js",
            "./count.js": "C:\\Users\\mj\\Desktop\\webpack5\\code\\webpackGenerate\\src\\count.js"
        }*/
        const deps = getDeps(ast, absolutePath)
        // 获取入口code
        const code = getCode(ast)
        return {
            absolutePath, // 绝对路径
            deps, // 依赖对象
            code // 经过babel转换字符串code
        }
    }

    // 生成代码文件
    generate(depsGraph) {
        /*
        depsGraph结构表
          {
            "C:\Users\mj\Desktop\webpack5\code\webpackGenerate\src\index.js": {
                "code": "\"use strict\";\n
                    // require函数其实是loaderRequire函数,其返回值是runCode中exports私有变量

                    // 将require(\"./add.js\")解析为对象
                    // {
                    //      default: function add (arg1,arg2) { ... },
                    //      __esModule: { value: true }
                    // }

                    \n var _add = _interopRequireDefault(require(\"./add.js\"));
                    \n\n var _count = _interopRequireDefault(require(\"./count.js\"));
                    // 判断exports是否为esModule,不是则创建对应对象
                    \n\n function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { \"default\": obj };
                    }
                    \n\n console.log((0, _add[\"default\"])(1, 2));
                    \n console.log((0, _count[\"default\"])(3, 2));",
                "deps": {
                    "./add.js": "C:\\Users\\mj\\Desktop\\webpack5\\code\\webpackGenerate\\src\\add.js",
                    "./count.js": "C:\\Users\\mj\\Desktop\\webpack5\\code\\webpackGenerate\\src\\count.js"
                }
           },
            "C:\\Users\\mj\\Desktop\\webpack5\\code\\webpackGenerate\\src\\add.js": {
                "code": "\"use strict\";\n
                    // 装载私有的exports变量,为babel类型的exports,让后续代码可用
                    \n Object.defineProperty(exports, \"__esModule\", {\n  value: true\n});
                    \n exports[\"default\"] = add;
                    \n\n function add(a, b) {\n  return a + b;\n}",
                "deps": {}
           },
            "C:\\Users\\mj\\Desktop\\webpack5\\code\\webpackGenerate\\src\\count.js": {
                "code": "\"use strict\";\n
                    // 装载私有的exports变量,为babel类型的exports,让后续代码可用
                    \n Object.defineProperty(exports, \"__esModule\", {\n  value: true\n});
                    \n exports[\"default\"] = count;
                    \n\n function count(a, b) {\n  return a - b;\n}",
                "deps": {}
            }
         }
        */
        const entryPath = path.resolve(process.cwd(),this.options.entry)
        const bundle = `(function(depsGraph) {
            function runCode(absolutePath){
                var exports = {}
                function loaderRequire(relativePath) {
                    // 找到引入模块的绝对路径
                    // depsGraph[absolutePath]包含所有依赖deps
                    // 当relativePath为add.js/count.js时,absolutePath为xxx/index.js
                    // 当relativePath为childCount.js时,absolutePath为xxx/count.js
                    
                    // 返回当前runCode内私有变量exports
                    return runCode(depsGraph[absolutePath].deps[relativePath])
                }
                (function (require, exports, code) {
                    // 这个的require变量名,最重要,对应eval运行的字符串代码中require函数
                    // eval内代码调用require函数(loaderRequire),再去调用外层runCode
                    eval(code)
                })(loaderRequire, exports,depsGraph[absolutePath].code)
                // 对应babel转换的代码,所以必须返回exports对象,该对象装载了模块输出内容 
                return exports
            }
            runCode(${JSON.stringify(entryPath)})
        })(${JSON.stringify(depsGraph)})`
        // 生成输出文件的绝对路径
        const outputPath = path.resolve(this.options.output.path,this.options.output.fileName)
        // 写入文件
        /*
           "\"use strict\";\n
           // 原代码: var _add = _interopRequireDefault(require(\"./add.js\")); 转换为以下代码
           \n var _add = _interopRequireDefault(
                {
                    default: function add (arg1,arg2) { ... },
                    __esModule: { value: true }
                }
           );
           // 此处代码也一样进行上方转换
           \n var _count = _interopRequireDefault(require(\"./count.js\"));
           // 判断exports是否为esModule,不是则创建对应对象
           \n function _interopRequireDefault(obj) {
               return obj && obj.__esModule ? obj : { \"default\": obj };
           }
           \n console.log((0, _add[\"default\"])(1, 2));
           \n console.log((0, _count[\"default\"])(3, 2));",
        * */
        fs.writeFileSync(outputPath, bundle, 'utf-8')
    }
}

module.exports = compiler
