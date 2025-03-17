const app = getApp();

Page({
  data: {
    userInfo: null,
    totalReward: 0,
    totalPunchDays: 0,
    totalPracticeTime: 0,
    isLogin: false,
    rankings: [],
    punchRecords: [],
    showLoginModal: false,
    username: "",
    password: "",
    showPwdModal: false, // 控制修改密码弹窗
    oldPassword: "", // 原密码
    newPassword: "", // 新密码
    confirmPassword: "", // 确认新密码
    balance: 0,  // 账户余额
    withdrawAmount: '',  // 提现金额
    showWithdrawModal: false,  // 控制提现弹窗
    showRecordsModal: false,  // 控制记录弹窗
    withdrawRecords: [],  // 提现记录
  },

  onShow() {
    this.checkLoginStatus();
    if (this.data.isLogin) {
      this.loadUserData();
      this.loadRankings();
      this.loadWithdrawRecords();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    this.setData({
      isLogin: !!app.globalData.userInfo,
      userInfo: app.globalData.userInfo,
    });
  },

  // 加载用户数据
  loadUserData() {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        balance: parseFloat(userInfo.balance || 0).toFixed(2),
        isLogin: true,
      });
    }
  },

  // 获取用户信息
  getUserProfile() {
    this.setData({
      showLoginModal: true,
      username: "",
      password: "",
    });
  },

  // 显示登录弹窗
  hideLoginModal() {
    this.setData({
      showLoginModal: false,
    });
  },

  onUsernameInput(e) {
    this.setData({
      username: e.detail.value,
    });
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value,
    });
  },

  // 处理登录
  async handleLogin() {
    const { username, password } = this.data;

    if (!username || !password) {
      wx.showToast({
        title: "请输入账号和密码",
        icon: "none",
      });
      return;
    }

    try {
      // 查询用户
      const db = app.globalData.db;
      const { data } = await db
        .collection("users")
        .where({
          username,
          password,
        })
        .get();

      if (data && data.length > 0) {
        const userInfo = data[0];
        // 保存到全局变量
        app.globalData.userInfo = userInfo;
        // 保存到本地存储
        wx.setStorageSync("userInfo", userInfo);

        this.setData({
          isLogin: true,
          userInfo,
          showLoginModal: false,
        });

        wx.showToast({
          title: "登录成功",
          icon: "success",
        });

        // 登录成功后加载数据
        this.loadUserData();
        this.loadRankings();
      } else {
        wx.showToast({
          title: "账号或密码错误",
          icon: "none",
        });
      }
    } catch (err) {
      console.error("登录失败:", err);
      wx.showToast({
        title: "登录失败，请重试",
        icon: "none",
      });
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
      } else {
        this.generateDefaultRankings();
      }
    } catch (err) {
      console.error("获取排行榜失败：", err);
      this.generateDefaultRankings();
    }
  },

  // 生成默认排行榜数据
  generateDefaultRankings() {
    const defaultRankings = [
      {
        username: "user1",
        nickName: "张小明",
        totalPunchDays: 15,
        totalPracticeTime: 820,
        totalReward: 108.5,
      },
      {
        username: "user2",
        nickName: "李小华",
        totalPunchDays: 12,
        totalPracticeTime: 645,
        totalReward: 89.2,
      },
      {
        username: "user3",
        nickName: "王小军",
        totalPunchDays: 10,
        totalPracticeTime: 520,
        totalReward: 75.6,
      },
    ];

    this.setData({ rankings: defaultRankings });
  },

  // 清除数据
  clearData() {
    wx.showModal({
      title: "提示",
      content: "确定要清除所有打卡记录吗？",
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync("punchRecords");
          wx.removeStorageSync("userInfo");
          app.globalData.userInfo = null;

          this.setData({
            isLogin: false,
            userInfo: null,
            totalPunchDays: 0,
            totalPracticeTime: 0,
            totalReward: 0,
          });

          wx.showToast({
            title: "清除成功",
            icon: "success",
          });
        }
      },
    });
  },

  loadStatistics() {
    const records = wx.getStorageSync("punchRecords") || [];
    const totalReward = wx.getStorageSync("totalReward") || 0;

    this.setData({
      totalPunchDays: records.length,
      totalReward: totalReward.toFixed(2),
    });
  },

  generateRankings() {
    const currentUserRecords = wx.getStorageSync("punchRecords") || [];
    const currentUser = {
      userId: "current",
      userName: this.data.userInfo?.nickName || "我",
      totalPunchDays: currentUserRecords.length,
      totalPracticeTime: currentUserRecords.reduce(
        (sum, r) => sum + r.practiceTime,
        0
      ),
      totalReward: currentUserRecords.reduce(
        (sum, r) => sum + Number(r.reward),
        0
      ),
    };

    const fakeUsers = [
      {
        userId: "user1",
        userName: "张小明",
        totalPunchDays: 15,
        totalPracticeTime: 820,
        totalReward: 108.5,
      },
      {
        userId: "user2",
        userName: "李小华",
        totalPunchDays: 12,
        totalPracticeTime: 645,
        totalReward: 89.2,
      },
      {
        userId: "user3",
        userName: "王小军",
        totalPunchDays: 10,
        totalPracticeTime: 520,
        totalReward: 75.6,
      },
    ];

    const allUsers = [currentUser, ...fakeUsers];

    allUsers.sort((a, b) => {
      if (b.totalPunchDays !== a.totalPunchDays) {
        return b.totalPunchDays - a.totalPunchDays;
      }
      return b.totalPracticeTime - a.totalPracticeTime;
    });

    this.setData({
      rankings: allUsers.slice(0, 5),
    });
  },

  // 加载打卡记录
  async loadPunchRecords() {
    try {
      if (!app.globalData.openid) {
        console.log("openid未获取，跳过加载打卡记录");
        return;
      }

      const db = app.globalData.db;
      const { data } = await db
        .collection("punch_records")
        .where({
          userId: app.globalData.openid,
        })
        .orderBy("createTime", "desc") // 按时间倒序
        .limit(10) // 最近10条记录
        .get();

      this.setData({
        punchRecords: data,
      });
      console.log("打卡记录:", data);
    } catch (err) {
      console.error("获取打卡记录失败:", err);
    }
  },

  // 显示修改密码弹窗
  showModifyPwdModal() {
    this.setData({
      showPwdModal: true,
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  },

  // 隐藏修改密码弹窗
  hideModifyPwdModal() {
    this.setData({
      showPwdModal: false,
    });
  },

  // 输入框事件处理
  onOldPwdInput(e) {
    this.setData({ oldPassword: e.detail.value });
  },

  onNewPwdInput(e) {
    this.setData({ newPassword: e.detail.value });
  },

  onConfirmPwdInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  // 处理修改密码
  async handleModifyPwd() {
    const { oldPassword, newPassword, confirmPassword } = this.data;

    if (!oldPassword || !newPassword || !confirmPassword) {
      wx.showToast({
        title: "请填写完整",
        icon: "none",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      wx.showToast({
        title: "两次密码不一致",
        icon: "none",
      });
      return;
    }

    try {
      const db = app.globalData.db;

      // 验证原密码
      const { data } = await db
        .collection("users")
        .where({
          username: app.globalData.userInfo.username,
          password: oldPassword,
        })
        .get();

      if (!data || data.length === 0) {
        wx.showToast({
          title: "原密码错误",
          icon: "none",
        });
        return;
      }

      // 更新密码
      await db
        .collection("users")
        .doc(app.globalData.userInfo._id)
        .update({
          data: {
            password: newPassword,
          },
        });

      wx.showToast({
        title: "密码修改成功",
        icon: "success",
      });

      this.hideModifyPwdModal();
    } catch (err) {
      console.error("修改密码失败:", err);
      wx.showToast({
        title: "修改失败，请重试",
        icon: "none",
      });
    }
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: "提示",
      content: "确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync("userInfo");
          // 清除全局变量
          app.globalData.userInfo = null;
          // 更新页面状态
          this.setData({
            isLogin: false,
            userInfo: null,
            totalPunchDays: 0,
            totalPracticeTime: 0,
            totalReward: 0,
          });

          wx.showToast({
            title: "已退出登录",
            icon: "success",
          });
        }
      },
    });
  },

  // 阻止事件冒泡
  stopPropagation(event) {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
  },

  // 修改头像
  handleChangeAvatar() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: "请先登录",
        icon: "none",
      });
      return;
    }

    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: async (res) => {
        try {
          wx.showLoading({
            title: "更新中...",
            mask: true,
          });

          const tempFilePath = res.tempFilePaths[0];
          // 将图片转为base64
          const base64 = wx
            .getFileSystemManager()
            .readFileSync(tempFilePath, "base64");
          const avatarUrl = `data:image/jpeg;base64,${base64}`;

          const db = app.globalData.db;
          // 更新用户头像
          await db
            .collection("users")
            .doc(app.globalData.userInfo._id)
            .update({
              data: {
                avatarUrl: avatarUrl,
              },
            });

          // 更新全局用户信息
          app.globalData.userInfo.avatarUrl = avatarUrl;
          // 更新本地存储
          wx.setStorageSync("userInfo", app.globalData.userInfo);
          // 更新页面数据
          this.setData({
            userInfo: app.globalData.userInfo,
          });

          wx.hideLoading();
          wx.showToast({
            title: "更新成功",
            icon: "success",
          });
        } catch (err) {
          console.error("更新头像失败:", err);
          wx.hideLoading();
          wx.showToast({
            title: "更新失败",
            icon: "none",
          });
        }
      },
    });
  },

  // 显示提现弹窗
  showWithdrawModal() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    this.setData({ showWithdrawModal: true });
  },

  // 隐藏提现弹窗
  hideWithdrawModal() {
    this.setData({ 
      showWithdrawModal: false,
      withdrawAmount: ''
    });
  },

  // 提现金额输入
  onWithdrawAmountInput(e) {
    this.setData({
      withdrawAmount: e.detail.value
    });
  },

  // 显示提现记录
  async showWithdrawRecords() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const db = app.globalData.db;
      
      // 检查集合是否存在
      try {
        const { data } = await db.collection('withdraw_records')
          .where({
            userId: app.globalData.userInfo._id
          })
          .orderBy('createTime', 'desc')
          .get();

        this.setData({
          withdrawRecords: data,
          showRecordsModal: true
        });
      } catch (err) {
        if (err.errCode === -502005) {
          // 集合不存在，显示空记录
          this.setData({
            withdrawRecords: [],
            showRecordsModal: true
          });
        } else {
          throw err;
        }
      }

    } catch (err) {
      console.error('获取提现记录失败:', err);
      wx.showToast({
        title: '获取记录失败',
        icon: 'none'
      });
    }
  },

  // 隐藏提现记录
  hideRecordsModal() {
    this.setData({ showRecordsModal: false });
  },

  // 修改登录弹窗的点击处理
  handleModalTap() {
    this.hideLoginModal();
  },

  // 修改内容区域的点击处理
  handleContentTap(event) {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
  },

  // 修改提现弹窗的点击处理
  handleWithdrawModalTap() {
    this.hideWithdrawModal();
  },

  // 修改提现记录弹窗的点击处理
  handleRecordsModalTap() {
    this.hideRecordsModal();
  },

  // 处理提现
  async handleWithdraw() {
    const amount = parseFloat(this.data.withdrawAmount);
    if (!amount || amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }

    if (amount > this.data.balance) {
      wx.showToast({
        title: '余额不足',
        icon: 'none'
      });
      return;
    }

    try {
      const db = app.globalData.db;
      const now = new Date();
      const withdrawRecord = {
        userId: app.globalData.userInfo._id,
        username: app.globalData.userInfo.username,
        nickName: app.globalData.userInfo.nickName,
        amount: amount,
        beforeBalance: Number(this.data.balance),
        afterBalance: Number((this.data.balance - amount).toFixed(2)),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        createTime: db.serverDate()
      };

      // 添加提现记录
      await db.collection('withdraw_records').add({
        data: withdrawRecord
      });

      // 更新用户余额
      const newBalance = withdrawRecord.afterBalance;
      await db.collection('users').doc(app.globalData.userInfo._id).update({
        data: {
          balance: newBalance
        }
      });

      // 更新全局用户信息
      app.globalData.userInfo.balance = newBalance;
      wx.setStorageSync('userInfo', app.globalData.userInfo);

      // 更新页面数据
      this.setData({
        balance: newBalance,
        showWithdrawModal: false,
        withdrawAmount: ''
      });

      wx.showToast({
        title: '提现成功',
        icon: 'success'
      });

      // 刷新用户数据和提现记录
      this.loadUserData();
      this.loadWithdrawRecords();

    } catch (err) {
      console.error('提现失败:', err);
      wx.showToast({
        title: '提现失败，请重试',
        icon: 'none'
      });
    }
  },

  // 加载提现记录
  async loadWithdrawRecords() {
    try {
        const db = app.globalData.db;
        const { data } = await db.collection('withdraw_records')
            .where({
                userId: app.globalData.userInfo._id
            })
            .orderBy('createTime', 'desc')
            .limit(10)  // 限制显示最近10条记录
            .get();

        // 格式化时间
        const formattedRecords = data.map(record => ({
            ...record,
            date: this.formatDate(record.date), // 格式化日期
            time: this.formatTime(record.createTime)  // 使用 createTime 进行格式化
        }));

        this.setData({
            withdrawRecords: formattedRecords
        });
    } catch (err) {
        console.error('获取提现记录失败:', err);
    }
  },

  // 日期格式化方法
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 时间格式化方法
  formatTime(timeStr) {
    if (!timeStr) return "00:00"; // 如果没有时间字符串，返回默认值

    const time = new Date(timeStr);
    
    // 检查时间是否有效
    if (isNaN(time.getTime())) {
        console.error("Invalid time:", timeStr);
        return "00:00"; // 返回默认值
    }

    return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
  }
});
