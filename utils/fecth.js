import axios from 'axios'
import Vue from 'vue'
import store from '@/vuex/store.js'
let curRequest = 0
// const baseTable = {
//     '/api/order': {
//         target: "http://10.20.12.97:3369"
//     },
//     '/api/menu': {
//         target: "http://10.20.92.48:3363"
//     }
// }
/*
            '/api': {
                // target: "http://webapp.hoperun.com:8002",
                target: "http://10.20.92.48:3363",
                // target: "http://10.20.13.12:3363",
                // target: "http://10.20.12.97:3363",
                changeOrigin: true
            },
            '/web': {
                target: "http://10.20.12.232:3361",
                changeOrigin: true
            },
*/
const prodBaseTable = {
    '/api/menu': "http://10.20.92.48:3363",
    '/api/order': "http://10.20.12.97:3369",
    '/web': "http://10.20.13.87:3361"//"http://10.20.12.232:3361"
}

const service = axios.create({
    baseURL: process.env.BASE_URL, // api的base_url
    timeout: 50000 // 请求超时时间
})

// 拦截请求
service.interceptors.request.use(config => {

    if (process.env.NODE_ENV === 'production') {
        console.log('in production, intercept request')
        const requestUrl = config.url
        Object.keys(prodBaseTable).some(prefix => {
            let result = requestUrl.match(prefix)
            if (result) {
                config.url = prodBaseTable[prefix] + config.url
                return true
            }
            return false
        })
    }    

    // debugger
    curRequest++
    if (config.showLoading === false) {
        return config
    }
    Vue.$vux.loading.show()
    
    return config
})

// 拦截响应
service.interceptors.response.use(
    
    response => {
        if (--curRequest === 0) {
            Vue.$vux.loading.hide()
        }
        return response.data;
    },
    error => {
        if (--curRequest === 0) {
            Vue.$vux.loading.hide()
        }
        return Promise.reject(error)
    }
)

export default service