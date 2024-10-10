const mongoose = require('mongoose');

// 메시지 스키마 정의
const messageSchema = new mongoose.Schema({
  user: { type: String, required: true },
  content: { type: String, required: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// 채널 스키마 정의
const channelSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // 채널 ID 필드
  name: { type: String, required: true },
  description: { type: String },
  groupId: { type: String, required: true },
  creator: { type: String, required: true },
  messages: { type: Array, default: [] }  // 메시지 배열
});

module.exports = mongoose.model('Channel', channelSchema);
