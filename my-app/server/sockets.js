// socket.js
const { Server } = require('socket.io'); // socket.io 가져오기
const http = require('http');
const Channel = require('./models/Channel'); // Channel 모델 가져오기
const User = require('./models/user'); // User 모델 가져오기

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

    socket.on('joinChannel', async (channelId, username) => {
      socket.join(channelId);
      console.log(`User joined channel: ${channelId}`);
      console.log(`${username} joined channel: ${channelId}`); // 사용자 이름과 채널 ID 콘솔에 출력


      // MongoDB에 사용자 정보 저장
      try {
        const user = await User.findOneAndUpdate(
          { username: username },
          { $addToSet: { channels: channelId } },
          { new: true, upsert: true }
        );

        const channel = await Channel.findOne({ id: channelId });
        if (channel) {
          if (!channel.activeUsers.includes(username)) {
            channel.activeUsers.push(username);
            await channel.save(); // 변경 사항 저장
            console.log(`Active users updated: ${channel.activeUsers}`);
          }
          socket.to(channelId).emit('userJoined', { username });
        }
      } catch (error) {
        console.error('Error saving user to MongoDB:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected');
      const channelId = [...socket.rooms].find(room => room !== socket.id); // 현재 방의 채널 ID 가져오기
      const username = socket.handshake.query.username; // 연결된 사용자 이름 가져오기
    
      if (channelId) {
        const channel = await Channel.findOne({ id: channelId });
        if (channel && channel.activeUsers.includes(username)) {
          channel.activeUsers = channel.activeUsers.filter(user => user !== username); // 사용자 제거
          await channel.save(); // 변경 사항 저장
          console.log(`Active users updated after disconnect: ${channel.activeUsers}`);
        }
      }
    });
  });

  return io; // io 객체를 반환
}

module.exports = setupSocket;
