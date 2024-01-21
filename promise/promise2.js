const pending = 'pending'
const fulfill = 'fulfilled'
const rejected = 'rejected'
class promise2{
    constructor(context) {
        this.status = pending
        this.value = null
        this.resolveFun = []
        this.rejectFun = []
        const resolve = (val) => {
            if(this.status !== pending) { return }
            setTimeout(() => {
                this.value = val
                this.status = fulfill
                this.resolveFun.forEach((fn) => {
                  fn(val)
                })
            }, 0)
        }
        const reject = (val) => {
            if(this.status !== pending) { return }
            setTimeout(() => {
                this.value = val
                this.status = rejected
                this.rejectFun.forEach((fn) => {
                    fn(val)
                })
            }, 0)
        }
        try{
            context(resolve,reject)
        }catch (e) {
            reject(e)
        }

    }
    then(onResolved, onRejected) {
        // 输出处理
        function resolveHandle(promise, value, resolve, reject) {
            if (promise === value) {
                reject('循环引用')
                return
            }
            if(value instanceof promise2) {
                value.then((val) => {
                    resolveHandle(promise, val, resolve, reject)
                },(err) => {
                  reject(err)
                })
            } else {
                resolve(value)
            }
        }
        // 值穿透
        onResolved = onResolved instanceof Function ? onResolved: val => val
        onRejected = onRejected instanceof Function ? onRejected: val => val
        if (this.status === pending) {
            const pendingPromise = new promise2((resolve, reject) => {
                // 装载函数
                this.resolveFun.push((val) => {
                    resolveHandle(pendingPromise, onResolved(val), resolve, reject)
                })
                this.rejectFun.push((val) => {
                    resolveHandle(pendingPromise, onRejected(val), resolve, reject)
                })
            })
            return pendingPromise
        } else {
            let val = this.value
            let res = null
            if (this.status === fulfill) {
                res = onResolved(val)
            } else {
                res = onRejected(val)
            }
            const currentPromise = new promise2((resolve, reject) => {
                resolveHandle(currentPromise, res, resolve, reject)
            })
            return currentPromise
        }
    }
    catch(cb) {
        return this.then(null, cb)
    }
    finally(cb) {
        return this.then(cb, cb)
    }
    static resolve(val) {
        return new promise2((resolve,reject) => {
          resolve(val)
        })
    }
    static try(fn) {
        return new promise2((resolve,reject) => {
            resolve(fn())
        })
    }
    static reject(val) {
        return new promise2((resolve,reject) => {
            reject(val)
        })
    }
    // 等待全部完成，有一个失败则失败
    static all(promiseList) {
        const length = promiseList.length
        let num = 0
        let resArr = []
        return new promise2((resolve, reject) => {
            promiseList.forEach((promise, index) => {
              promise.then((res) => {
                  resArr[index] = res
                  num++
                  if (num === length) {
                      resolve(resArr)
                  }
              }, (err) => {
                reject(err)
              })
            })
        })
    }
    // 不论失败或成功，都返回成功
    static allsettled(promiseList) {
        const length = promiseList.length
        let num = 0
        let resArr = []
        return new promise2((resolve, reject) => {
            promiseList.forEach((promise, index) => {
                promise.then((res) => {
                    resArr[index] = res
                    num++
                    if (num === length) {
                        resolve(resArr)
                    }
                }, (err) => {
                    resArr[index] = err
                    num++
                    if (num === length) {
                        resolve(resArr)
                    }
                })
            })
        })
    }
    // 最先完成的那个
    static race(promiseList) {
        return new promise2((resolve, reject) => {
            promiseList.forEach((promise) => {
                promise.then((res) => {
                    resolve(res)
                }, (err) => {
                    reject(err)
                })
            })
        })
    }
    // 任意成功的一个，全部失败则返回失败
    static any(promiseList) {
        const length = promiseList.length
        let num = 0
        let resArr = []
        return new promise2((resolve, reject) => {
            promiseList.forEach((promise, index) => {
                promise.then((res) => {
                    resolve(res)
                }, (err) => {
                    resArr[index] = err
                    num++
                    if (num === length) {
                        reject(err)
                    }
                })
            })
        })
    }
}

let p = new promise2((resolve, reject) => {
  resolve(2)
})

p.then((val) => {
  return val*2
}).then((val) => {
    return new promise2((resolve, reject) => {
      resolve(val*2)
    })
}).then((val) => {
    console.log(val)
})
