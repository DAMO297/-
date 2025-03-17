const cloud = require("wx-server-sdk");

// 重新初始化云开发环境
cloud.init({
  env: "jtdk-3grpduic9d1147ad"  // 确保环境 ID 正确
});

exports.main = async (event, context) => {
  console.log("云函数开始执行");

  try {
    const wxContext = cloud.getWXContext();
    console.log("wxContext详情:", wxContext);

    if (!wxContext.OPENID) {
      console.error("获取OPENID失败");
      return {
        success: false,
        error: "获取OPENID失败",
        wxContext
      };
    }

    const result = {
      success: true,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID
    };

    console.log("云函数返回结果:", result);
    return result;
  } catch (err) {
    console.error("云函数错误:", err);
    return {
      success: false,
      error: err.message || "未知错误",
      stack: err.stack
    };
  }
};