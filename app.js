// app.js
App({
  globalData: {
    userInfo: null,
    cloud: null,
    db: null,
  },

  async onLaunch() {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      return;
    }

    try {
      // 创建共享环境实例
      const c1 = new wx.cloud.Cloud({
        resourceAppid: "wxc091df7e9abdf8b7",
        resourceEnv: "jtdk-3grpduic9d1147ad",
      });

      // 等待初始化完成
      await c1.init();

      // 保存云环境实例
      this.globalData.cloud = c1;

      // 获取数据库实例
      this.globalData.db = c1.database();

      console.log("云环境初始化成功");

      // 检查登录状态
      const savedUserInfo = wx.getStorageSync("userInfo");
      if (savedUserInfo) {
        this.globalData.userInfo = savedUserInfo;
      }

      wx.cloud.init({
        env: "jtdk-3grpduic9d1147ad",
        traceUser: true,
      });
    } catch (err) {
      console.error("初始化失败:", err);
    }
  },

  // 登录成功后保存用户信息
  handleLoginSuccess(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync("userInfo", userInfo);
  },

  // 退出登录
  handleLogout() {
    this.globalData.userInfo = null;
    // 清除本地存储
    wx.removeStorageSync("userInfo");
  },

  // 登录方法
  async login(username, password) {
    try {
      const db = this.globalData.db;
      const { data } = await db
        .collection("users")
        .where({
          username,
          password,
        })
        .get();

      if (data && data.length > 0) {
        const userInfo = data[0];
        this.globalData.userInfo = userInfo;
        wx.setStorageSync("userInfo", userInfo);
        wx.showToast({
          title: "登录成功",
          icon: "success",
        });
        return userInfo;
      } else {
        throw new Error("账号或密码错误");
      }
    } catch (err) {
      console.error("登录失败:", err);
      throw err;
    }
  },

  // 注册方法
  async register(username, password) {
    try {
      const db = this.globalData.db;
      // 检查用户名是否已存在
      const { data } = await db.collection("users").where({ username }).get();

      if (data && data.length > 0) {
        throw new Error("用户名已存在");
      }

      // 创建新用户
      await db.collection("users").add({
        data: {
          username,
          password,
          nickName: username,
          avatarUrl: "/static/images/default-avatar.png",
          totalPunchDays: 0,
          totalPracticeTime: 0,
          totalReward: 0,
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
        },
      });

      wx.showToast({
        title: "注册成功",
        icon: "success",
      });

      // 注册成功后自动登录
      return await this.login(username, password);
    } catch (err) {
      console.error("注册失败:", err);
      throw err;
    }
  },
});
