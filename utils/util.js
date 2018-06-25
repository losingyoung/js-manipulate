export default {
    install(Vue, options) {
        Vue.prototype.showConfirm = function(fun, msg, confirmtext) {
            const _this = this;
            _this.$vux.confirm.show({
                content: msg,
                // 组件除show外的属性
                onCancel() {},
                onConfirm() {
                    fun && fun();
                },
                confirmText: confirmtext,
                cancelText: '再等等'
            });
        }
        Vue.prototype.showAlert = function(fun, msg, btntext) {
            const _this = this;
            _this.$vux.alert.show({
                content: msg,
                buttonText: btntext,
                onShow() {},
                onHide() {
                    fun && fun();
                }
            });
        }
        Vue.prototype.showToast = function(fun, msg) {
            const _this = this;
            _this.$vux.toast.show({
                type: "text",
                text: msg,
                time: "1500",
                width: 200 + "px",
                onHide() {
                    fun && fun();
                }
            });
        }
    }
}