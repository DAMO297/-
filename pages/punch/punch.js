const app = getApp();

Page({
  data: {
    userInfo: null,
    isLogin: false,
    practiceTime: 0,
    content: "",
    reward: 0,
    date: "",
    time: "",
    todayPunched: false,
    showLoginModal: false,
    username: "",
    password: "",
    isRegister: false,
    confirmPassword: "",
    rememberPassword: false,
    rankings: [],
  },

  onLoad() {
    // 页面加载时检查登录状态和已保存的账号密码
    const userInfo = wx.getStorageSync("userInfo");
    const savedCredentials = wx.getStorageSync("savedCredentials");

    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        isLogin: true,
        showLoginModal: false,
      });
    }

    if (savedCredentials) {
      this.setData({
        username: savedCredentials.username,
        password: savedCredentials.password,
        rememberPassword: true,
      });
    }
  },

  onShow() {
    // 检查全局登录状态，因为可能从其他页面退出登录
    const userInfo = app.globalData.userInfo;
    this.setData({
      isLogin: !!userInfo,
      userInfo: userInfo || null,
    });

    // 如果未登录，显示登录弹窗
    if (!userInfo) {
      this.setData({
        showLoginModal: true,
      });
    }

    this.checkTodayPunch();
    // 添加加载排行榜数据
    if (this.data.todayPunched) {
      this.loadRankings();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    this.setData({
      isLogin: !!userInfo,
      userInfo: userInfo || null,
      showLoginModal: !userInfo,
    });
  },

  // 显示登录弹窗
  showLoginModal() {
    this.setData({
      showLoginModal: true,
      username: "",
      password: "",
      confirmPassword: "",
      isRegister: false,
    });
  },

  // 隐藏登录弹窗
  hideLoginModal() {
    this.setData({
      showLoginModal: false,
    });
  },

  // 切换登录/注册模式
  switchLoginRegister() {
    this.setData({
      isRegister: !this.data.isRegister,
      username: "",
      password: "",
      confirmPassword: "",
    });
  },

  // 用户名输入
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value,
    });
  },

  // 密码输入
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value,
    });
  },

  // 确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value,
    });
  },

  // 处理登录或注册
  async handleLoginOrRegister() {
    if (this.data.isRegister) {
      await this.handleRegister();
    } else {
      await this.handleLogin();
    }
  },

  // 处理登录
  async handleLogin() {
    const { username, password, rememberPassword } = this.data;
    if (!username || !password) {
      wx.showToast({
        title: "请输入账号和密码",
        icon: "none",
      });
      return;
    }

    try {
      const userInfo = await app.login(username, password);
      app.handleLoginSuccess(userInfo);

      // 如果选择记住密码，保存账号密码
      if (rememberPassword) {
        wx.setStorageSync("savedCredentials", { username, password });
      } else {
        wx.removeStorageSync("savedCredentials");
      }

      this.setData({
        showLoginModal: false,
        userInfo: userInfo,
        isLogin: true,
      });
    } catch (err) {
      wx.showToast({
        title: err.message || "登录失败",
        icon: "none",
      });
    }
  },

  // 处理注册
  async handleRegister() {
    const { username, password, confirmPassword } = this.data;
    if (!username || !password || !confirmPassword) {
      wx.showToast({
        title: "请填写完整信息",
        icon: "none",
      });
      return;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: "两次密码不一致",
        icon: "none",
      });
      return;
    }

    try {
      await app.register(username, password);
      this.setData({
        showLoginModal: false,
        userInfo: app.globalData.userInfo,
      });
    } catch (err) {
      wx.showToast({
        title: err.message || "注册失败",
        icon: "none",
      });
    }
  },

  // 检查今日是否已打卡
  async checkTodayPunch() {
    if (!this.data.isLogin) return;

    try {
      const db = app.globalData.db;
      const today = new Date().toLocaleDateString();
      const { data } = await db
        .collection("punch_records")
        .where({
          userId: app.globalData.userInfo._id,
          date: today,
        })
        .get();

      const todayPunched = data.length > 0;
      this.setData({
        todayPunched,
        reward: todayPunched ? data[0].reward : 0,
      });

      // 如果已打卡，加载排行榜数据
      if (todayPunched) {
        this.loadRankings();
      }
    } catch (err) {
      console.error("检查打卡状态失败:", err);
    }
  },

  // 输入练习时长
  onTimeInput(e) {
    const time = parseInt(e.detail.value);
    const reward = this.calculateReward(time);
    this.setData({
      practiceTime: time,
      reward: reward,
    });
  },

  // 输入打卡内容
  onContentInput(e) {
    this.setData({
      content: e.detail.value,
    });
  },

  // 计算奖励金额
  calculateReward(time) {
    // 基础奖励：每分钟0.1元
    let reward = time * 0.1;
    // 额外奖励：超过60分钟每分钟0.2元
    if (time > 5) {
      reward += (time - 60) * 0.1;
    }
    return parseFloat(reward.toFixed(2));
  },

  // 提交打卡
  async handlePunch() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: "请先登录",
        icon: "none",
      });
      return;
    }

    // 检查今日是否已打卡
    const today = new Date().toLocaleDateString();
    const db = app.globalData.db;
    const { data } = await db
      .collection("punch_records")
      .where({
        userId: app.globalData.userInfo._id,
        date: today,
      })
      .get();

    if (data.length > 0) {
      wx.showToast({
        title: "今日已打卡",
        icon: "none",
      });
      return;
    }

    if (!this.data.practiceTime) {
      wx.showToast({
        title: "请输入练习时长",
        icon: "none",
      });
      return;
    }

    try {
      const now = new Date();
      const date = now.toLocaleDateString();
      const time = now.toLocaleTimeString();

      // 随机生成奖励金额
      const reward = this.generateRandomReward();

      const record = {
        userId: app.globalData.userInfo._id,
        practiceTime: this.data.practiceTime,
        content: this.data.content,
        reward: reward,
        date: date,
        time: time,
        createTime: db.serverDate(),
      };

      // 添加打卡记录
      await db.collection("punch_records").add({
        data: record,
      });

      // 更新用户统计数据和余额
      const newBalance = parseFloat(
        (app.globalData.userInfo.balance || 0) + reward
      ).toFixed(2);
      await db
        .collection("users")
        .doc(app.globalData.userInfo._id)
        .update({
          data: {
            totalPunchDays: db.command.inc(1),
            totalPracticeTime: db.command.inc(this.data.practiceTime),
            totalReward: Number(
              (app.globalData.userInfo.totalReward + reward).toFixed(2)
            ),
            balance: Number(newBalance), // 在用户表中更新余额
          },
        });

      // 重新获取最新的用户数据
      const { data: updatedUser } = await db
        .collection("users")
        .doc(app.globalData.userInfo._id)
        .get();

      // 更新全局用户信息
      app.globalData.userInfo = updatedUser;
      // 更新本地存储
      wx.setStorageSync("userInfo", updatedUser);

      wx.showToast({
        title: "打卡成功",
        icon: "success",
      });

      // 重置表单
      this.setData({
        practiceTime: 0,
        content: "",
        reward: 0,
        todayPunched: true,
      });

      // 刷新所有页面
      const pages = getCurrentPages();
      pages.forEach((page) => {
        if (
          page.route.includes("record/record") ||
          page.route.includes("profile/profile")
        ) {
          if (typeof page.loadUserData === "function") {
            page.loadUserData();
          }
          if (typeof page.loadPunchRecords === "function") {
            page.loadPunchRecords();
          }
        }
      });

      // 打卡成功后加载排行榜
      await this.loadRankings();

      // 清理3个月前的记录
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      await db
        .collection("punch_records")
        .where({
          userId: app.globalData.userInfo._id,
          createTime: db.command.lt(threeMonthsAgo),
        })
        .remove();
    } catch (err) {
      console.error("打卡失败:", err);
      wx.showToast({
        title: "打卡失败，请重试",
        icon: "none",
      });
    }
  },

  // 生成随机奖励金额
  generateRandomReward() {
    const min = 0.5; // 最小奖励
    const max = 5.0; // 最大奖励
    return parseFloat((Math.random() * (max - min) + min).toFixed(2)); // 随机生成并保留两位小数
  },

  // 阻止事件冒泡
  stopPropagation(event) {
    if (event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
  },

  // 登录成功回调
  handleLoginSuccess(userInfo) {
    app.handleLoginSuccess(userInfo);
    this.setData({
      showLoginModal: false,
    });
    this.loadUserData();
  },

  // 退出登录
  handleLogout() {
    app.handleLogout();

    // 保持记住密码的状态和账号密码不变
    const { rememberPassword, username, password } = this.data;

    this.setData({
      isLogin: false,
      userInfo: null,
      showLoginModal: true,
      // 如果记住密码，保持账号密码，否则清空
      username: rememberPassword ? username : "",
      password: rememberPassword ? password : "",
      confirmPassword: "",
      isRegister: false,
    });
  },

  // 切换记住密码
  toggleRememberPassword() {
    this.setData({
      rememberPassword: !this.data.rememberPassword,
    });

    // 如果取消记住密码，清除保存的账号密码
    if (!this.data.rememberPassword) {
      wx.removeStorageSync("savedCredentials");
    }
  },

  // 修改登录弹窗的点击处理
  handleModalTap() {
    this.hideLoginModal();
  },

  // 修改内容区域的点击处理
  handleContentTap(event) {
    if (event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
  },

  // 加载排行榜数据
  async loadRankings() {
    try {
      const db = app.globalData.db;
      if (!db) {
        console.error("数据库实例未初始化");
        return;
      }

      const { data } = await db
        .collection("users")
        .orderBy("totalPunchDays", "desc")
        .orderBy("totalPracticeTime", "desc")
        .limit(5)
        .get();

      if (data && data.length > 0) {
        // 格式化排行榜数据中的奖励金额
        const formattedData = data.map((item) => ({
          ...item,
          totalReward: parseFloat(item.totalReward || 0).toFixed(2),
        }));
        this.setData({ rankings: formattedData });
      }
    } catch (err) {
      console.error("获取排行榜失败：", err);
    }
  },
});
