const mongoose = require('mongoose');

// User 스키마 정의
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roles: [String],
  groups: [String],
  dob: { type: Date, required: true },
  profilePictureUrl: { type: String }  // 프로필 사진 URL 추가
});

// User 모델 생성
const User = mongoose.model('User', userSchema);

module.exports = User;
