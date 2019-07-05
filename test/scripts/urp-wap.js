(function ($) {
    $.getUrlParam = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
    };

    //uri编码
    $.encodeURI = function (uri) {
        return encodeURIComponent(uri);
    };
    //uri解码
    $.decodeURI = function (uri) {
        return decodeURIComponent(uri);
    };

    $.fn.setForm = function (jsonValue) {
        var obj = this;
        $.each(jsonValue, function (name, ival) {
            var $oinput = obj.find("input[name='" + name + "']");
            if ($oinput.attr("type") == "radio" || $oinput.attr("type") == "checkbox") {
                $oinput.each(function () {
                    if (Object.prototype.toString.apply(ival) == '[object Array]') {//是复选框，并且是数组
                        for (var i = 0; i < ival.length; i++) {
                            if ($(this).val() == ival[i])
                                $(this).attr("checked", "checked");
                        }
                    } else {
                        if ($(this).val() == ival)
                            $(this).attr("checked", "checked");
                    }
                });
            } else if ($oinput.attr("type") == "textarea") {//多行文本框
                obj.find("[name=" + name + "]").html(ival);
            } else {
                obj.find("[name=" + name + "]").val(ival);
            }
        });
    };

    Vue.filter('format-currency', function (value) {
        return accounting.formatMoney(value, "¥ ");
    });

})($);

var urp = {
    post: function (url, data, successCallback, errorCallback) {
        $.showLoading();
        var s = successCallback ? (function (result) { $.hideLoading(); successCallback(result); }) : (function () { $.hideLoading(); });
        var e = errorCallback ? (function (result) { $.hideLoading(); errorCallback(result); }) : (function () { $.hideLoading(); $.alert("系统错误，请重试!", "错误提示"); });
        $.ajax({
            type: 'POST',
            url: url,
            dataType: "json",
            data: data,
            success: s,
            error: e
        });
    },
    isWeChatBrower: function () {//判断是是微信浏览器
        return (navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == "micromessenger");
    }
};

/**
*   密码验证框使用：
*   每次输完6位直接摧毁dom
*   urp.passwordDialog(function (pwd) {
        $.showLoading();
        setTimeout(function () {
            console.log(pwd)
            $.hideLoading();
        }, 2000)
    });
    // 或
    urp.passwordDialog({
        title: "",
        callback: function (pwd) {
            $.showLoading();
            setTimeout(function () {
                console.log(pwd)
                $.hideLoading();
            }, 2000)
        }
    });
*/
(function(urp) {
    function PasswordDialog(options) {
        this.options = options;
        if (typeof this.options == "function") {
            // 先判断参数是否是函数，如果是，则为回调函数
            this.callback = this.options;
            this.title = "请输入支付密码";
        } else if (typeof this.options === "object") {
            // 如果参数是对象，则提取title，和callback
            this.title = this.options.title ? this.options.title : "请输入支付密码";
            this.options.callback && typeof this.options.callback == "function" ? this.callback = this.options.callback : (function () {
                throw "缺少回调函数";
            })();
        }else{
            throw "参数不合法";
        }
        
        this.activeIndex = 0;
        this.init();
        this.aClick();
    }
    PasswordDialog.prototype = {
        constroctor: PasswordDialog,
        init: function () {
            var str = '<div class="js_dialog" id="passwordDialog" style="position:absolute;z-index:10">' +
                        '<div class="weui-mask weui-mask--visible"></div>' +
                        '<div class="weui-dialog weui-dialog--visible">' +
                            '<div class="weui-dialog__hd"><strong class="weui-dialog__title">' + this.title + '</strong></div>' +
                            '<div class="weui-dialog__hd" style="padding:0.8em 2.2em">' +
                                '<div id="pwd_div" class="password_div_css" style="margin:auto;">' +
	                                 '<span class="password_span_css"></span>' +
	                                 '<span class="password_span_css"></span>' +
	                                 '<span class="password_span_css"></span>' +
                                     '<span class="password_span_css"></span>' +
                 	                 '<span class="password_span_css"></span>' +
	                                 '<span class="password_span_css password_span_css_last"></span>' +
				                '</div>' +
                            '</div>' +
                            '<div class="button-sp-area" style="line-height:0.4; padding-bottom:20px; padding-left:5px;padding-right:5px;">';

            for (var i = 1; i < 10; i++) {
                str += '<a name="numberKeyboard" class="weui-btn weui-btn_mini weui-btn_default key_grid" style="line-height:3;font-size:large;margin-top:8px;">' + i + '</a>';
            }

            str += '<a name="close" class="weui-btn weui-btn_mini weui-btn_default key_grid" style="line-height:3;margin-top:8px;">关闭</a>' +
                    '<a name="numberKeyboard" class="weui-btn weui-btn_mini weui-btn_default key_grid" style="line-height:3;font-size:large;margin-top:8px;">0</a>' +
                    '<a name="reset" class="weui-btn weui-btn_mini weui-btn_default key_grid" style="line-height:3;margin-top:8px;">重置</a>' +
                '</div>' +
            '</div>' +
        '</div>';

            $(document.body).append($(str));
        },
        aClick: function () {
            var self = this;
            var password = "";
            $(document).on("click.numberKeyboard", "a[name='numberKeyboard']", function () {
                self.activeIndex++;
                if (self.activeIndex <= 6) {
                    $("#pwd_div span").eq(self.activeIndex - 1).addClass("circle");
                    password = password + $(this).text();
                    if (self.activeIndex == 6) {
                        //密码提交逻辑处理,做一下简单变换处理
                        self.destroy();
                        password = 3 * password - 1;
                        self.callback(password);
                        return;
                    }
                } else {
                    $.alert("页面出错，请重新输入!");
                    password = "";
                    self.reset();
                }
            })
            .on("click.close", "a[name='close']", function () {
                password = "";
                self.destroy();
            })
            .on("click.reset", "a[name='reset']", function () {
                password = "";
                self.reset();
            });
        },
        reset: function () {
            $("#pwd_div span").removeClass("circle");
            this.activeIndex = 0;
        },
        destroy: function () {
            $("#passwordDialog").remove();
            this.activeIndex = 0;
            // 销毁事件
            $(document).off(".numberKeyboard");
            $(document).off(".close");
            $(document).off(".reset");
        },
    }

    var passwordDialog = function (options) {
        new PasswordDialog(options);
    }
    urp.passwordDialog = passwordDialog;
})(urp)
    



