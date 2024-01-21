const stateObj = {
    pending: 'pending',
    fulfilled: 'fulfilled',
    rejected: 'rejected'
}
class promise{
    constructor(callback) {
        this.state = stateObj.pending
        this.value = ''
        this.resolveFun = []
        this.rejectFun = []
        const resolve = (value) => {
            if (this.state !== stateObj.pending) return
            setTimeout(() => {
                this.state = stateObj.fulfilled
                this.value = value
                for(let fn of this.resolveFun) {
                    fn(value)
                }
            },0)
        }
        const reject = (value) => {
            if(this.state !== stateObj.pending) return
            setTimeout((value) => {
                this.state = stateObj.rejected
                this.value = value
                for(let fn of this.rejectFun) {
                    fn(value)
                }
            },0)
        }
        try{
            callback(resolve,reject)
        }catch (err){
            reject(err)
        }
    }
    then(onResolve, onReject) {
        // resolve 结果处理
        function resolveHandle(pro,value,resolve, reject) {
            if(pro === value) {
                reject('循环引用')
                return
            } else if (value instanceof promise) {
                value.then((val) => {
                    resolveHandle(pro,val,resolve,reject)
                },(res) => {
                    reject(res)
                })
            } else {
                resolve(value)
            }
        }
        // 值穿透
        onResolve = onResolve instanceof Function ? onResolve : value => value
        onReject = onReject instanceof Function ? onReject : res => { throw res }

        if(this.state === stateObj.pending) {
            // 装载函数,并为新promise延续
            let resolveFun = this.resolveFun
            let rejectFun = this.rejectFun
            let currentPromise = new promise((resolve,reject) => {
                resolveFun.push(function (val) {
                    try{
                        let res = onResolve(val)
                        // resolve(res)
                        resolveHandle(currentPromise,res,resolve,reject)
                    } catch(err) {
                        reject(err)
                    }
                })
                rejectFun.push(function(val) {
                    try{
                        let res = onReject(val)
                        // resolve(res)
                        resolveHandle(currentPromise,res,resolve,reject)
                    }catch(err) {
                        reject(err)
                    }
                })
            })
            return currentPromise
        } else {
            // 直接输出
            let value = this.value
            let state = this.state
            let res = null
            let currentPromise = new promise((resolve,reject) => {
                try{
                    if (state === stateObj.fulfilled) {
                        res = onResolve(value)
                    } else {
                        res = onReject(value)
                    }
                    resolveHandle(currentPromise,res,resolve,reject)
                } catch(err) {
                    reject(err)
                }
            })
            return currentPromise
        }
    }
    // 处理错误信息
    catch(rejected) {
        return this.then(null,rejected)
    }
    // 成功失败全部执行
    finally(callback){
        return this.then(callback,callback)
    }
    // all静态方法,等待所有都执行完毕，任何一个失败则失败
    static all(promiseList) {
        const length = promiseList.length
        let num = 0
        let valList = []
        return new promise((resolve,reject) => {
            promiseList.forEach((promise, index) => {
                try {
                  promise.then((val) => {
                      valList[index] = val
                      num++
                      if(num === length) {
                        resolve(valList)
                      }
                  })
                }catch (err){
                    reject(err)
                }
            }).catch((err) => {
              reject(err)
            })
        })
    }
    // allSettled静态方法，无论成功或失败都返回成功
    static allSettled(promiseList) {
        const length = promiseList.length
        let valList = []
        let num = 0
        return new promise((resolve,reject) => {
          promiseList.forEach((promise,index) => {
            promise.then((val) => {
                valList[index] = val
                num++
                if (num === length) {
                    resolve(valList)
                }
            }).catch((err) => {
                valList[index] = err
                num++
                if(num === length) {
                   resolve(valList)
                }
            })
          })
        })
    }
    // race静态方法，返回最先成功的一个，任何一个失败则失败
    static race(promiseList) {
        return new promise((resolve,reject) => {
            promiseList.forEach((promise,index) => {
              promise.then((res) => {
                resolve(res)
              }).catch((err) => {
                reject(err)
              })
            })
        })
    }
    // any静态方法，任何一个成功则返回，否则失败
    static any(promiseList) {
        const length = promiseList.length
        let valList = []
        let num = 0
        return new promise((resolve,reject) => {
          promiseList.forEach((promise,index) => {
            promise.then((val) => {
              resolve(val)
            }).catch((err) => {
                valList[index] = err
                num++
                if(num === length) {
                    reject(valList)
                }
            })
          })
        })
    }
    // resolve静态方法
    static resolve(val) {
        return new promise((resolve, reject) => {
          resolve(val)
        })
    }
    // try静态方法,执行同步或异步函数
    static try(func) {
        return new promise((resolve,reject) => {
            const res = func()
            resolve(res)
        })
    }
    // reject静态方法
    static reject(val) {
        return new promise((resolve,reject) => {
            reject(val)
        })
    }
}
