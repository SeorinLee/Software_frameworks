const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const channelSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  groupId: { type: String, required: true }, // 그룹 ID와 연결
  creator: { type: String, required: true },
});

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
