// 懒加载使用improt（）函数并配合代码分割
export default function() {
    // 懒加载：当文件需要使用时才加载,懒加载也需要代码分割（testfn.js单独打包）。但是如果资源较大，加载时间就会较长，有延迟
    // 正常加载可以认为是并行加载（同一时间加载多个文件）没有先后顺序，先加载了不需要的资源就会浪费时间
    // 预加载 prefetch（兼容性很差）：会在使用之前，提前加载js文件 等其他资源加载完毕，浏览器空闲了，再偷偷加载资源。所以在懒加载的基础上加上预加载会更好

    // 将import的内容放在异步回调函数中使用，testfn.js才会被加载(然后多次引用不会重复加载)
    import(/* webpackChunkName: 'test', webpackPrefetch: true */ './testfn.js').then((fn) => {
      fn()
    })
}
