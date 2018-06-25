//调用APP二维码方法
export const readBarcode = () => {
    return new Promise(function(resolve, reject) {
        smartmobile.nativeUIWidget.readBarcode(function(r) {
            resolve(r);
        }, function(r) {
            resolve(r);
        });
    })
};

//读取会员信息
export const readProperty = () => {
    return new Promise(function(resolve, reject) {
        smartmobile.storage.readProperty({
            "key": "KEY_USER"
        }, function(ret) {
            resolve(ret);
        });
    })
};

//返回
export const goBack = () => {
    if (history.length > 1) {
        history.go(-1);
    } else {
        smartmobile.appmanager.stopTopApp();
    }
};