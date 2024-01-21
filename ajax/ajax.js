function ajaxGet(url,params,success,fail) {
    const xhr = new XMLHttpRequest()
    xhr.open('get',url + encodeParams(params), true)
    xhr.send(null)
    xhr.onReadyStateChange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                success(xhr.responseText)
            } else {
                fail && fail(xhr.responseText)
            }
        }
    }
}
function encodeParams(params) {
    return Object.keys(params).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
    }).join('&')
}

function ajaxPost(url,params,success,fail) {
    const xhr = new XMLHttpRequest()
    xhr.open('post',url,true)
    xhr.send(JSON.stringify(params))
    xhr.onReadyStateChange = function () {
        if (xhr.readyState === 4) {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                success(xhr.responseText)
            } else {
                fail(xhr.responseText)
            }
        }
    }
}
