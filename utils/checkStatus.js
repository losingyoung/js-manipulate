import Vue from 'vue'
import store from '@/vuex/store.js'
import md5 from "blueimp-md5";
import * as Service  from "@/api";
const autoSignOutTime = 300000
// export function checkStatus() {
//     return new Promise((resolve, reject) => {
//         resolve('0')
//     })
// }
// 到 展示密码框
export function checkIn() {
    store.commit('showCheckInDialog')
}

// 发送后台验证是否签到成功
export function validateCheckInStatus(userCode) {

    userCode = md5(userCode)
    let SNCode = store.state.SNCode
    let storeCode = store.state.storeCode
    Service.userCheckIn({storeCode, cashierCode: userCode, sn: SNCode}).then(res => {
        if (res.code == "0") {
            switch (res.status) {
                case "5":
                    Vue.$vux.alert.show({content:res.message})
                    break;
                case "4": 
                    Vue.$vux.confirm.show({
                        content: '当前用户已经在另一台机器签到, 是否覆盖?',
                        onConfirm() {
                            forceCheckIn(userCode)
                        }
                    })
                    break;
                // 按道理不会出现2 因为肯定是首次签到 但开发时会刷新页面 所以会返回2
                case "1":
                case "2":
                   let userName = res.cashier.cashierName
                   checkInSuccess({userCode, userName})
                   break;
                default:
                    break;
            }
        } else {
            Vue.$vux.alert.show({content:res.message})
        }
    }).catch(err => {
        Vue.$vux.alert.show({content:'服务器错误'})
    })
}


// 操作前检查是否是符合此用户此设备的签到
export function checkIfValidCheck() {
    // alert("签到验证错误 开发模式先通过")
    // return Promise.resolve()
    let storeCode = store.state.storeCode
    let userCode = store.state.userCode
    let sn = store.state.SNCode
    if (!userCode) {
        store.commit('showCheckInDialog')
        return Promise.reject()
    }
  return new Promise((resolve, reject) => {
    Service.userCheckIn({storeCode, cashierCode: userCode, sn}).then(res => {
        if (res.code == "0") {
            switch (res.status) {
                // 按道理不会是1 因为当前肯定是签到状态
                case "1":
                  let userName = res.cashier.cashierName
                  checkInSuccess({userCode, userName})
                  break;
                case "5":
                    Vue.$vux.alert.show({content:res.message})
                    break;
                case "4": 
                    // 不匹配 要退出 重新签到
                    store.commit('checkOutStatus')
                    checkIn()
                    reject()
                    break;
                case "2":
                   resolve()
                   break;
                default:
                    break;
            }
        } else {
            Vue.$vux.alert.show({content:res.message})
        }
    }).catch(err => {
        if (process.env.NODE_ENV === 'development') {
            alert("签到验证错误 开发模式先通过")
            resolve()
        }
        reject("签到验证错误")
    })
  })
}
// 强制签到
function forceCheckIn(userCode) {
    let storeCode = store.state.storeCode
    let sn = store.state.SNCode
    Service.userForceCheckIn({storeCode, cashierCode: userCode, sn}).then(res => {
        if (res.code == "0") {
            checkInSuccess({
                userCode,
                userName: res.cashier.cashierName
            })
        } else {
            Vue.$vux.alert.show({content:res.message})
        }

    }).catch(err => {
        Vue.$vux.alert.show({content:'服务器错误'})
    })
    
}
// 自动签退
const AutoCheckOut = (function () {
    let binded = false
    const debouncedCheckOut = debounce(silenceCheckOut, autoSignOutTime)
    function initAutoCheckOut() {
        // 防止重复调用
        if (binded) {return}
        binded = true
        // 先调用下 防止登陆完就什么没点
        debouncedCheckOut()
        window.addEventListener('touchstart', debouncedCheckOut)
    }
    function destroyAutoCheckOut() {
        binded = false
        window.removeEventListener('touchstart', debouncedCheckOut)
        debouncedCheckOut.clearTimer()
    }
    return {
        bind:initAutoCheckOut,
        destroy: destroyAutoCheckOut
    }
})()


// 签退
export function checkOut() {
    let storeCode = store.state.storeCode
    let cashierCode = store.state.userCode
    let sn = store.state.SNCode
    Vue.$vux.confirm.show({
        content: '确定签退吗？',
        onConfirm() {
            Service.userCheckOut({storeCode, cashierCode}).then(res => {
                if (res.code == "0") {
                    store.commit('checkOutStatus')
                    Vue.$vux.toast.show({
                        text: '签退成功',
                        time:1500
                    })
                    AutoCheckOut.destroy()
                } else {
                   Vue.$vux.alert.show({content:'签退失败'})
                }
                

            })
        }
    })
}
function debounce(cb, delay) {
   let timer = null
   function wrapped() {
       if (!timer) {
         timer = setTimeout(cb, delay)
       } else {
         clearTimeout(timer)
         timer = setTimeout(cb, delay)
       }
   }
   wrapped.clearTimer = function() {
    clearTimeout(timer)
    timer = null
   }
   return wrapped
}

// 默默签退
function silenceCheckOut(e) {
    console.log('checkout')
    let storeCode = store.state.storeCode
    let cashierCode = store.state.userCode
    Service.userCheckOut({storeCode, cashierCode}).then(res => {
        if (res.code == "0") {
            store.commit('checkOutStatus')
            AutoCheckOut.destroy()
        } 
        

    })

}
function checkInSuccess({userCode, userName}) {
    store.commit('checkInStatus')
    store.commit('setUserCode', userCode)
    store.commit('setUserName', userName)
    Vue.$vux.toast.show({
        text: '签到成功',
        time:1500
    })
    AutoCheckOut.bind()
}
