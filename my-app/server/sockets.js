// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const app = express();
// const port = 4002;

// app.use(bodyParser.json());
// app.use(cors());

// let messages = [];  // 메시지 저장소

// // 메시지 조회 엔드포인트 (주기적으로 클라이언트에서 호출)
// app.get('/api/messages', (req, res) => {
//   res.json(messages);
// });

// // 메시지 전송 엔드포인트
// app.post('/api/messages', (req, res) => {
//   const { user, message } = req.body;
//   if (message && user) {
//     messages.push({ user, message, timestamp: new Date() });  // 유저와 메시지 함께 저장
//     res.status(200).json({ success: true });
//   } else {
//     res.status(400).json({ success: false, message: 'User and message are required' });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });

// socket.js
const { Server } = require('socket.io'); // socket.io 가져오기
const http = require('http');

// 소켓 서버 설정 함수
function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:4200", // 클라이언트 URL
      methods: ["GET", "POST"],
    }
  });

  // 소켓 연결 설정
  io.on('connection', (socket) => {
    console.log('A user connected');

    // 클라이언트가 특정 채널에 들어올 때 해당 채널에 참여
    socket.on('joinChannel', (channelId) => {
      socket.join(channelId);
      console.log(`User joined channel: ${channelId}`);
      
      // 입장 메시지를 모든 클라이언트에게 전송
      socket.to(channelId).emit('userJoined', socket.username); // socket.username을 사용하여 입장 메시지 전송
    });

    // 연결 해제 시
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io; // io 객체를 반환
}

module.exports = setupSocket;
