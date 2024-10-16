const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  message: { type: String, required: false },  // 필수에서 선택으로 변경
  fileUrl: { type: String },
  fileType: { type: String },
  timestamp: { type: Date, default: Date.now }
});


const channelSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  groupId: { type: String, required: true },   // 그룹 ID와 연결
  creator: { type: String, required: true },
  members: [String],                           // 채널에 참가한 유저 목록
  messages: [messageSchema],                   // 메시지 목록 (messageSchema 배열)
  joinLog: [String],                           // 채널에 참가한 유저 기록
  leaveLog: [String]                           // 채널을 떠난 유저 기록
});


const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
