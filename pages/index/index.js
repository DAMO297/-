const app = getApp();

Page({
  data: {
    motto: "Hello World",
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    canIUseOpenData: false,
  },

  onLoad() {
    this.setData({
      canIUseOpenData: wx.canIUse("open-data.type.userAvatarUrl"),
      canIUseGetUserProfile: wx.getUserProfile ? true : false,
    });
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: "用于完善会员资料",
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true,
        });
      },
    });
  },

  getUserInfo(e) {
    if (e.detail.userInfo) {
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true,
      });
    }
  },
});
