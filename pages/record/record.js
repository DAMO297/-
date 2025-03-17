const app = getApp();

Page({
  data: {
    punchRecords: [],
    totalPunchDays: 0,
    totalPracticeTime: 0,
    totalReward: 0,
  },

  onShow() {
    if (app.globalData.userInfo) {
      this.loadUserData();
      this.loadPunchRecords();
    }
  },

  // 加载用户数据
  loadUserData() {
    try {
      const userInfo = app.globalData.userInfo;
      if (userInfo) {
        this.setData({
          totalPunchDays: userInfo.totalPunchDays || 0,
          totalPracticeTime: userInfo.totalPracticeTime || 0,
          totalReward: parseFloat(userInfo.totalReward || 0).toFixed(2),
        });
      }
    } catch (err) {
      console.error("获取用户数据失败：", err);
    }
  },

  // 加载打卡记录
  async loadPunchRecords() {
    try {
      const db = app.globalData.db;
      const { data } = await db
        .collection("punch_records")
        .where({
          userId: app.globalData.userInfo._id,
        })
        .orderBy("createTime", "desc")
        .limit(30)
        .get();

      this.setData({
        punchRecords: data.map((record) => ({
          ...record,
          date: this.formatDate(record.date),
          time: this.formatTime(record.time),
          practiceTime: record.practiceTime,
          reward: record.reward.toFixed(2),
          content: record.content,
        })),
      });
    } catch (err) {
      console.error("获取打卡记录失败:", err);
      wx.showToast({
        title: "获取记录失败",
        icon: "none",
      });
    }
  },

  // 日期格式化方法
  formatDate(dateStr) {
    try {
      // 首先尝试标准化日期字符串格式
      let standardDate;

      if (typeof dateStr === "string") {
        // 处理 "Wed Feb 19 2025" 这样的格式
        if (dateStr.includes(" ")) {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) {
            // 如果解析失败，尝试手动解析
            const parts = dateStr.split(" ");
            const months = {
              Jan: "01",
              Feb: "02",
              Mar: "03",
              Apr: "04",
              May: "05",
              Jun: "06",
              Jul: "07",
              Aug: "08",
              Sep: "09",
              Oct: "10",
              Nov: "11",
              Dec: "12",
            };
            standardDate = `${parts[3]}/${months[parts[1]]}/${parts[2].padStart(
              2,
              "0"
            )}`;
          } else {
            standardDate = `${d.getFullYear()}/${String(
              d.getMonth() + 1
            ).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
          }
        } else if (dateStr.includes("-")) {
          // 处理 yyyy-mm-dd 格式
          standardDate = dateStr.replace(/-/g, "/");
        } else if (dateStr.includes("/")) {
          // 已经是 yyyy/mm/dd 格式
          standardDate = dateStr;
        } else {
          // 处理时间戳或其他格式
          const d = new Date(dateStr);
          standardDate = `${d.getFullYear()}/${String(
            d.getMonth() + 1
          ).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
        }
      } else {
        // 处理非字符串类型
        const d = new Date(dateStr);
        standardDate = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}/${String(d.getDate()).padStart(2, "0")}`;
      }

      // 使用标准化后的日期字符串创建 Date 对象
      const date = new Date(standardDate);

      // 确保日期有效
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateStr);
        return dateStr; // 返回原始值
      }

      // 返回标准格式
      return standardDate;
    } catch (err) {
      console.error("Date formatting error:", err);
      return dateStr; // 出错时返回原始值
    }
  },

  // 添加时间格式化方法
  formatTime(timeStr) {
    if (!timeStr) return "";

    // 如果是Date对象，直接格式化
    if (timeStr instanceof Date) {
      const hours = String(timeStr.getHours()).padStart(2, "0");
      const minutes = String(timeStr.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }

    // 处理字符串格式的时间
    if (typeof timeStr === "string") {
      // 移除可能存在的秒数
      return timeStr.split(":").slice(0, 2).join(":");
    }

    return timeStr;
  },

  exportRecords() {
    const records = this.data.punchRecords;

    if (records.length === 0) {
        wx.showToast({
            title: '没有打卡记录可导出',
            icon: 'none'
        });
        return;
    }

    // 创建 CSV 内容
    const csvHeader = '日期,时间,练习时长(分钟),奖励(元),内容\n';
    const csvRows = records.map(record => {
        return `${record.date},${record.time},${record.practiceTime},${record.reward},${record.content || ''}`;
    });
    const csvContent = csvHeader + csvRows.join('\n');

    // 创建文件并下载
    const filePath = `${wx.env.USER_DATA_PATH}/punch_records.csv`;
    wx.getFileSystemManager().writeFile({
        filePath: filePath,
        data: csvContent,
        encoding: 'utf8',
        success: () => {
            wx.showToast({
                title: '导出成功',
                icon: 'success'
            });
            // 提供下载链接
            wx.openDocument({
                filePath: filePath,
                fileType: 'csv',
                success: function (res) {
                    console.log('打开文档成功');
                },
                fail: function (err) {
                    console.error('打开文档失败', err);
                }
            });
        },
        fail: (err) => {
            console.error('导出失败', err);
            wx.showToast({
                title: '导出失败',
                icon: 'none'
            });
        }
    });
  },
});
