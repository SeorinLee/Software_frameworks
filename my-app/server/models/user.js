const mongoose = require('mongoose');

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // 사용자 이름
  password: { type: String, required: true }, // 비밀번호
  email: { type: String, required: true, unique: true }, // 이메일
  createdAt: { type: Date, default: Date.now } // 생성일
});

// 사용자 모델 내보내기
module.exports = mongoose.model('User', userSchema);
