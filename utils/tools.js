import {hasClass} from './dom.js'

export const getUrlParmas = (widhtHash = false) => {
    hasClass()
    var url = widhtHash ? window.location.hash.substr(2) : window.location.search; // #/删掉
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        var strs = str.split("&");
        for (var i = 0; i < strs.length; i++) {
            theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
        }
    }
    return theRequest;
}

function mangelProps(a) {
  return a.mangleProps
}
export const getGuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


//拼接多属性参数item
export const pickItem = (object, ...keys) => {
    let result = Object.create(null);

    for (let i = 0, len = keys.length; i < len; i++) {
        result[keys[i]] = object[keys[i]];
    }

    return result;
}



// 数字补0
export const pad = (num, n) => {
    var len = num.toString().length
    while (len < n) {
        num = "0" + num
        len++
    }
    return num
}



//截取字符  
export const sb_substr = (str, startp, endp) => {
    var i = 0,
        c = 0,
        unicode = 0,
        rstr = '';
    var len = str.length;
    var sblen = getChars(str);

    if (startp < 0) {
        startp = sblen + startp;
    }

    if (endp < 1) {
        endp = sblen + endp; // - ((str.charCodeAt(len-1) < 127) ? 1 : 2);  
    }
    // 寻找起点  
    for (i = 0; i < len; i++) {
        if (c >= startp) {
            break;
        }
        var unicode = str.charCodeAt(i);
        if (unicode < 127) {
            c += 1;
        } else {
            c += 2;
        }
    }

    // 开始取  
    for (i = i; i < len; i++) {
        var unicode = str.charCodeAt(i);
        if (unicode < 127) {
            c += 1;
        } else {
            c += 2;
        }
        rstr += str.charAt(i);

        if (c >= endp) {
            break;
        }
    }

    return rstr;
}

function getChars(str) {
    var i = 0;
    var c = 0.0;
    var unicode = 0;
    var len = 0;

    if (str == null || str == "") {
        return 0;
    }
    len = str.length;
    for (i = 0; i < len; i++) {
        unicode = str.charCodeAt(i);
        if (unicode < 127) { //判断是单字符还是双字符  
            c += 1;
        } else { //chinese  
            c += 2;
        }
    }
    return c;
}
