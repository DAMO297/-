const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 生成随机奖励
const generateReward = (practiceTime) => {
  // 基础奖励范围：1-10元，不考虑练习时长
  const reward = Math.random() * 9 + 1;  // 1到10之间的随机数
  // 保留两位小数
  return Number(reward.toFixed(2));
}

// 主题管理
const themeManager = {
  getTheme() {
    return wx.getStorageSync('theme') || 'light'
  },
  setTheme(theme) {
    wx.setStorageSync('theme', theme)
  }
}

module.exports = {
  formatTime,
  formatNumber,
  generateReward,
  themeManager
} 