const { resolve } = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const webpack = require('webpack');
const AddAssetHtmlWebpackPlugin = require('add-asset-html-webpack-plugin');
const hardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')

/*
  tree shaking：去除无用代码
    前提：1. 必须使用ES6模块化  2. 开启production环境 （就自动会把无用代码去掉）
    作用: 减少代码体积

    在package.json中配置
      "sideEffects": false 表示所有代码都没有副作用（都可以进行tree shaking）
        这样会导致的问题：可能会把css / @babel/polyfill （副作用）文件干掉
      所以可以配置："sideEffects": ["*.css", "*.less"] 不会对css/less文件tree shaking处理
*/



// 定义nodejs环境变量：决定使用browserslist的哪个环境
process.env.NODE_ENV = 'production'

module.exports = {
    entry: './src/index.js', // 可以是字符串地址、数组地址、对象地址
    /*
  entry: 入口起点
    1. string --> './src/index.js'
      单入口
      打包形成一个chunk。 输出一个bundle文件。
      此时chunk的名称默认是 main
    2. array  --> ['./src/index.js', './src/add.js']
      多入口
      所有入口文件最终只会形成一个chunk, 输出出去只有一个bundle文件。
        --> 只有在HMR功能中让html热更新生效~
    3. object
      多入口
      有几个入口文件就形成几个chunk，输出几个bundle文件
      此时chunk的名称是 key

      --> 特殊用法
        {
          // 所有入口文件最终只会形成一个chunk, 输出出去只有一个bundle文件。
          index: ['./src/index.js', './src/count.js'],
          // 形成一个chunk，输出一个bundle文件。
          add: './src/add.js'
        }
*/
    output: {
        // 使用contenthash配合cache-control能有效配合浏览器缓存
        // chunkshash hash 分别代表对应块hash与文件打包hash，chunkhash可能相同，
        // 而hash则是每次打包都不同，不管内容是否有变化
        filename: 'js/build_[contenthash:10].js',
        path: resolve(__dirname, 'build'),
        // 所有资源引入公共路径前缀 --> 'imgs/a.jpg' --> '/imgs/a.jpg'
        publicPath: '/',
        chunkFilename: 'js/[name]_chunk.js', // 非入口chunk的名称
        library: '[name]', // 打包整个库后向外暴露的变量名
        libraryTarget: 'window' // 变量名添加到哪个变量上 browser
        // libraryTarget: 'global' // 变量名添加到哪个变量上 node
        // libraryTarget: 'commonjs' // 变量名添加到哪个变量上 conmmonjs模块 exports
    },
    module: {
        // 防止 webpack 解析那些任何与给定正则表达式相匹配的文件。
        // 忽略的文件中不应该含有import,require,define的调用，或任何其他导入机制。
        // 忽略大型的 library 可以提高构建性能。
        // externals共用会导致externals失效，因为会不转换require(),导致文件无法读取
        noParse:/jquery/,
        rules: [
            {
                test: /\.less/,
                use: [
                    // 'style-loader', // 一起打包到js文件中
                    MiniCssExtractPlugin.loader, // 打包成单文件
                    'css-loader',
                    {
                        // 还需要子pakege.json中定义browserslist
                        loader: 'postcss-loader',
                        options: {
                            ident:'postcss',
                            plugins: () => [require('postcss-preset-env')()]
                        }
                    },
                    {
                        loders: 'less-loader',
                        options: {
                        }
                    }
                ]
            },
            {
                oneOf:[
                    {
                        test: /\.js$/,
                        use: [
                            'cache-loader', // 缓存对应loader所转换的文件
                            'thread-loader',
                            {
                                loader: 'babel-loader',
                                options: {
                                    // cacheDirectory: true,
                                    presets: [
                                        '@babel/preset-env',
                                        {
                                            useBuiltIns: 'usage', // 按需加载
                                            corejs: { version:3 }, // 制定core-js版本
                                            target: { // 制定向后兼容到什么版本
                                                chrome: '60',
                                                fireox: '50',
                                                safari: '10',
                                                ie: '9',
                                                edge: '17'
                                            }
                                        }
                                    ]
                                }
                            }
                        ],
                        includes: /src/,
                        excludes: /node_modules/
                    },
                    {
                        test: /\.js$/,
                        use: [
                            'cache-loader', // 缓存
                            'thread-loader', // 多线程
                            {
                                loader: 'eslint-loader',
                                options: {
                                    fix: true
                                }
                            }
                        ],
                        enforce: 'pre',
                        // enforce: 'post', // 延后执行
                        includes: /src/
                    },
                    {
                        test: /\.(jpg|png|gif)$/,
                        use: 'url-loader',
                        options: {
                            limit: 8 * 1024,
                            name: '[name]_[contenthash:10].[ext]',
                            outputPath: 'imgs',
                            esModule: false // 因为要配合html-loder的commenjs风格的转换，所以关闭esmodule风格
                        }
                    },
                    {
                        test: /\.html$/,
                        loader: 'html-loader'
                    },
                    {
                        exclude: /\.(js|css|html|less|jpg|png|gif)$/,
                        loader: 'file-loader',
                        options: {
                            outputPath: 'media'
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({ // 将css打包成单文件
            filename: 'css/built[contenthash:10].css'
        }),
        new OptimizeCssAssetsWebpackPlugin(), // 压缩css
        new HtmlWebpackPlugin({ //  自动引入各个打包文件
            template: './src/index.html', // 使用模板
            minify: {
                collapseWhitespace: true, // 移除空格
                removeComments: true // 移除注释
            }
        }),
        // 告诉webpack哪些库不参与打包，同时使用时的名称也得变
        new webpack.DllReferencePlugin({
            manifest: resolve(__dirname, 'dll/manifest.json')
        }),
        // 将某个文件打包输出到build目录下，并在html中自动引入该资源
        new AddAssetHtmlWebpackPlugin({
            filepath: resolve(__dirname, 'dll/jquery.js')
        }),
        // 缓存模块，提升打包速度
        new hardSourceWebpackPlugin(),
        // 将runtimechunk文件，以行内形式打包进index.html,减少文件请求
        new ScriptExtHtmlWebpackPlugin({
            inline: /runtime~.+\.js$/  //正则匹配runtime文件名
        })
],
    devServer: {
        port: 8080, // 端口
        hot: true, // 打开HMR 热模块更新
        compress: true, // gzie
        open: true, // 自动打开浏览器
        proxy: {
            '/api':{
                target: 'https://localhost:8080', // 请求访问地址
                changeOrigin: true, // 修改源访问
                pathRewrite: {
                    '^/api': '/api' // 替换请求地址
                }
            }
        },
        /*跨域问题：同源策略中不同的协议、端口号、域名就会产生跨域。正常的浏览器和服务器之间有跨域，但是服务器之间没有跨域。
    代码通过代理服务器运行，所以浏览器和代理服务器之间没有跨域，浏览器吧请求发送到代理服务器上，代理服务器替你转发到另外一个服务器上
    服务器之间没有跨域，所以请求成功。代理服务器再把接收到的响应响应给浏览器。这样就解决开发环境下的跨域问题

    */
        // 不要显示启动服务器日志信息
        clientLogLevel: 'none',
        // 除了一些基本信息外，其他内容都不要显示
        quiet: true,
        // 如果出错了，不要全屏提示
        overlay: false,
        // 运行代码所在的目录
        contentBase: resolve(__dirname, 'build'),
        // 监视contentBase目录下的所有文件，一旦文件变化就会reload
        watchContentBase: true,
        watchOptions: {
            // 忽略文件
            ignored: /node_modules/
        },
    },
    devtool: 'eval-source-map',
    model: 'production', // development
    // 代码分割，会把node_modules中的文件打包到一起，如果是多入口则，
    // 会将公共引用打包到一个文件，共同引用。
    // externals防止将某些 import 的包(package)打包到 bundle 中，
    // 而是在运行时(runtime)再去从外部获取这些扩展依赖(external dependencies)
    externals: {
        // 拒绝jQuery被打包进来(通过cdn引入，速度会快一些)
        // 忽略import的库名 -- 导出的全局变量名称
        jquery: 'jQuery'
    },
    // 解析模块的规则
    resolve: {
        // 配置解析模块路径别名: 优点：当目录层级很复杂时，简写路径；缺点：路径不会提示
        alias: {
            $css: resolve(__dirname, 'src/css')
        },
        // 配置省略文件路径的后缀名（引入时就可以不写文件后缀名了）
        extensions: ['.js', '.json', '.jsx', '.css'],
        // 告诉 webpack 解析模块应该去找哪个目录
        modules: [resolve(__dirname, '../../node_modules'), 'node_modules']
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            /* 以下都是默认值，可以不写
            miniSize: 30 * 1024, // 分割的chunk最小为30kb（大于30kb的才分割）
            maxSize: 0, // 最大没有限制
            minChunks: 1, // 要提取的chunk最少被引用1次
            maxAsyncRequests: 5, // 按需加载时并行加载的文件的最大数量为5
            maxInitialRequests: 3, // 入口js文件最大并行请求数量
            automaticNameDelimiter: '~', // 名称连接符
            name: true, // 可以使用命名规则
            cacheGroups: { // 分割chunk的组
              vendors: {
                // node_modules中的文件会被打包到vendors组的chunk中，--> vendors~xxx.js
                // 满足上面的公共规则，大小超过30kb、至少被引用一次
                test: /[\\/]node_modules[\\/]/,
                // 优先级
                priority: -10
              },
              default: {
                // 要提取的chunk最少被引用2次
                minChunks: 2,
                prority: -20,
                // 如果当前要打包的模块和之前已经被提取的模块是同一个，就会复用，而不是重新打包
                reuseExistingChunk: true
              }
            }*/

        },
        /*
        chunkFilename中设置hash会导致一个问题：修改a文件导致b文件contenthash变化
        （因为在index.js中import a.js，index.js中记录了a.js的hash值，而a.js改变，其contenthash改变，
        导致index.js文件内容中记录的contenthash也改变，重新打包后index.js的contenthash也会变，这样就会使缓存失效）
        解决办法：runtimeChunk --> 将当前模块记录其他模块的hash单独打包为一个文件 runtime
        */
        // 默认值为false
        // true：对于每个entry会生成runtime~${entrypoint.name}的文件。
        // name:{}：自定义runtime文件的name,也可以是字符串value
        runtimeChunk: {
            name: entrypoint => `runtime~${entrypoint.name}`
        },
        // 默认为true，效果就是压缩js代码
        // webpack4默认的压缩为uglifyjs-webpack-plugin
        // webpack5默认TerserWebpackPlugin
        minimizer: [
            // 配置生产环境的压缩方案：js/css
            new TerserWebpackPlugin({
                // 开启缓存
                cache: true,
                // 开启多进程打包
                parallel: true,
                // 启用sourceMap(否则会被压缩掉)
                sourceMap: false
            })
        ]
    }
}
