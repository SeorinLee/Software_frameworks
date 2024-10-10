const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 4002;

app.use(bodyParser.json());
app.use(cors());

let messages = [];  // 메시지 저장소

// 메시지 조회 엔드포인트 (주기적으로 클라이언트에서 호출)
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// 메시지 전송 엔드포인트
app.post('/api/messages', (req, res) => {
  const { user, message } = req.body;
  if (message && user) {
    messages.push({ user, message, timestamp: new Date() });  // 유저와 메시지 함께 저장
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false, message: 'User and message are required' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
