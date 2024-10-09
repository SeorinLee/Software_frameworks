const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser'); // body-parser 추가
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const port = 4002;

// body-parser 미들웨어 설정
app.use(bodyParser.json());  // JSON 본문 파싱
app.use(bodyParser.urlencoded({ extended: true }));  // URL 인코딩된 본문 파싱


// MongoDB 연결
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chatApp');
    console.log('MongoDB 연결 성공');
  } catch (err) {
    console.error('MongoDB 연결 오류:', err);
  }
}

connectDB();

// MongoDB 채널 모델 가져오기
const Channel = require('./models/Channel');

const usersFilePath = path.join(__dirname, 'users.json');
const notificationsFilePath = path.join(__dirname, 'notifications.json');
const groupsFilePath = path.join(__dirname, 'groups.json');

// CORS 설정
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],  // 필요한 헤더 추가
}));


// Socket.IO 설정
const server = http.createServer(app); // HTTP 서버 생성
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",  // 클라이언트의 URL
    methods: ["GET", "POST"],
    credentials: true,  // 쿠키 및 인증 정보를 허용
  },
  transports: ['websocket', 'polling'],  // WebSocket을 우선 사용, 폴링을 폴백으로 사용
  path: '/socket.io'  // 경로 설정
});


// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinChannel', (channelId) => {
    socket.join(channelId);
    io.to(channelId).emit('userJoined', `User joined the channel ${channelId}`);
  });

  socket.on('sendMessage', async (message, channelId) => {
    try {
      const channel = await Channel.findOne({ id: channelId });
      if (!channel) {
        return console.log('Channel not found');
      }
      const newMessage = { user: message.user, content: message.content };
      channel.messages.push(newMessage);
      await channel.save();
      io.to(channelId).emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Error saving or sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 파일을 로드하는 유틸리티 함수
function loadFile(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  }
  return [];
}

// 파일 저장 유틸리티 함수
function saveFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 파일로 관리하는 데이터 로드
let users = loadFile(usersFilePath);
let notifications = loadFile(notificationsFilePath);
let groups = loadFile(groupsFilePath);

// 사용자 알림 추가 함수
function addNotification(userId, message) {
  if (!notifications[userId]) {
    notifications[userId] = [];
  }
  notifications[userId].push({ message, timestamp: new Date().toISOString() });
  saveFile(notificationsFilePath, notifications);
}

// 서버 상태 확인 엔드포인트
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// 사용자 목록 조회
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 사용자 알림 조회
app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const userNotifications = notifications[userId] || [];
  if (userNotifications.length > 0) {
    res.json(userNotifications);
  } else {
    res.status(404).json({ message: 'No notifications found' });
  }
});

// 사용자 인증 (로그인)
app.post('/api/auth', (req, res) => {
  const { email, password } = req.body;
  
  // email과 password로 사용자를 찾기
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    const username = user.username;

    // username 접두어에 따른 역할 설정
    let role = '';
    if (username.startsWith('s')) {
      role = 'Super Admin';
    } else if (username.startsWith('g')) {
      role = 'Group Admin';
    } else if (username.startsWith('u')) {
      role = 'User';
    }

    user.roles = [role];  // 역할 업데이트

    res.json(user);  // 사용자의 역할 정보 포함
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});


// 사용자 회원가입
app.post('/api/register', (req, res) => {
  const { username, password, firstName, lastName, email, dob } = req.body;

  if (!username || !password || !firstName || !lastName || !email || !dob) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (users.some(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  // 역할을 username 접두어에 따라 설정
  let roles = [];
  if (username.startsWith('s')) {
    roles = ['Super Admin'];
  } else if (username.startsWith('g')) {
    roles = ['Group Admin'];
  } else if (username.startsWith('u')) {
    roles = ['User'];
  } else {
    return res.status(400).json({ error: 'Username must start with "s", "g", or "u".' });
  }

  const newUser = {
    id: (users.length + 1).toString(),
    username,
    password,
    firstName,
    lastName,
    email,
    roles,
    groups: [],
    dob,
  };

  users.push(newUser);
  saveFile(usersFilePath, users);
  res.status(201).json({ success: true, user: newUser });
});

// 사용자 정보 업데이트
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // 이름 필드 업데이트
  const { firstName, lastName, email, dob } = req.body;
  if (firstName) users[userIndex].firstName = firstName;
  if (lastName) users[userIndex].lastName = lastName;
  if (email) users[userIndex].email = email;
  if (dob) users[userIndex].dob = dob;

  saveFile(usersFilePath, users);
  res.json({ success: true, user: users[userIndex] });
});

// Super Admin이 사용자 역할을 변경하는 API (알림만 보냄)
app.put('/api/super-admin/promote/:id', (req, res) => {
  const userId = req.params.id;
  const newRole = req.body.newRole;  // newRole을 req.body에서 가져옵니다.
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    console.error(`User with ID ${userId} not found`);
    return res.status(404).json({ error: 'User not found' });
  }

  if (!['Super Admin', 'Group Admin', 'User'].includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  // 역할 변경 알림을 보냄
  addNotification(userId, `Your role has been changed to ${newRole}. Please accept the promotion in your notifications.`);

  res.json({ success: true, message: `Promotion request sent to user ${users[userIndex].username}` });
});


app.post('/api/accept-promotion/:id', (req, res) => {
  const userId = req.params.id;
  let { newRole } = req.body;

  console.log('Received newRole:', `"${newRole}"`);  // 디버깅용 로그 추가
  
  // 공백 제거 및 소문자로 변환하여 처리
  newRole = newRole.trim().toLowerCase();

  // 사용자 찾기
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // 소문자로 변환된 newRole과 서버에서 허용하는 역할을 비교
  const roleMapping = {
    'super admin': 'Super Admin',
    'group admin': 'Group Admin',
    'user': 'User'
  };

  if (!roleMapping[newRole]) {
    console.error('Invalid role specified on server:', newRole);  // 디버깅 로그
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  const rolePrefixMapping = {
    'Super Admin': 's',
    'Group Admin': 'g',
    'User': 'u'
  };

  const user = users[userIndex];
  const newRoleFormatted = roleMapping[newRole];  // 원래 대문자로 포맷팅된 역할
  const rolePrefix = rolePrefixMapping[newRoleFormatted];

  // 기존 접두어(s, g, u) 제거 후 새로운 접두어 추가
  user.username = `${rolePrefix}${user.username.replace(/^(s|g|u)/, '')}`;

  // 역할 업데이트
  user.roles = [newRoleFormatted];  // 역할을 새롭게 설정

  // 변경된 사용자 데이터 저장
  saveFile(usersFilePath, users);

  // 해당 사용자 알림 삭제
  notifications[userId] = [];
  saveFile(notificationsFilePath, notifications);

  res.json({ success: true, newUsername: user.username, newRole: user.roles[0] });
});


// 그룹 생성
app.post('/api/groups', (req, res) => {
  const { name, description, creator } = req.body;

  if (!name || !description || !creator) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const newGroupId = Date.now().toString(); // 타임스탬프를 ID로 생성
  const creatorUser = users.find(u => u.username === creator);
  const creatorName = creatorUser ? `${creatorUser.firstName} ${creatorUser.lastName}` : 'Unknown';

  const newGroup = { id: newGroupId, name, description, creator, creatorName };
  groups.push(newGroup);

  console.log('New Group:', newGroup);  // 디버깅용 콘솔 로그 추가
  saveFile(groupsFilePath, groups);

  res.status(201).json({ group: newGroup });
});

// 그룹 삭제
app.delete('/api/groups/:id', (req, res) => {
  const groupId = req.params.id;
  const user = JSON.parse(req.headers.user); // 사용자 정보는 헤더에서 받아옴
  const groupIndex = groups.findIndex(group => group.id === groupId);

  if (groupIndex === -1) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const group = groups[groupIndex];
  if (user.roles.includes('Group Admin') && group.creator !== user.username) {
    return res.status(403).json({ error: 'You do not have permission to delete this group.' });
  }

  groups.splice(groupIndex, 1);
  saveFile(groupsFilePath, groups);

  res.status(200).json({ message: 'Group deleted successfully' });
});

// 그룹 조회
app.get('/api/groups', (req, res) => {
  try {
    // 모든 사용자가 모든 그룹을 볼 수 있도록 수정
    return res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups.' });
  }
});

// 특정 그룹 조회
app.get('/api/groups/:id', (req, res) => {
  const { id } = req.params;
  const group = groups.find(g => g.id === id);  // groups 배열에서 ID로 그룹 찾기
  
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  res.json(group);
});


app.get('/api/users/:id/groups', (req, res) => {
  const userId = req.params.id;
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userGroups = user.groups || [];

  // 그룹 정보 찾기: users.json의 그룹 ID를 기반으로 groups.json에서 상세 정보 매핑
  const joinedGroups = userGroups.map(userGroup => {
    const group = groups.find(g => g.id === userGroup.groupId);
    return group ? { ...group, status: userGroup.status } : null;
  }).filter(g => g !== null);  // null 값은 제외

  res.json(joinedGroups);
});


// 새로운 채널 생성 API
app.post('/api/groups/:groupId/channels', async (req, res) => {
  const { groupId } = req.params;
  const { name, description, creator } = req.body;

  console.log('Received data:', req.body); // 입력 데이터 확인

  if (!name || !description || !creator) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const newChannelId = Date.now().toString();

  const newChannel = new Channel({
    id: newChannelId,
    name,
    description,
    groupId,
    creator,
    messages: []
  });

  try {
    await newChannel.save();
    console.log('Channel successfully saved:', newChannel); // 저장 확인 로그
    return res.status(201).json(newChannel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return res.status(500).json({ message: 'Error creating channel', error });
  }
});

// 그룹 삭제
app.delete('/api/groups/:id', (req, res) => {
  const groupId = req.params.id;
  
  // 사용자 정보를 헤더에서 가져옵니다.
  const user = JSON.parse(req.headers.user); 
  
  const groupIndex = groups.findIndex(group => group.id === groupId);

  if (groupIndex === -1) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const group = groups[groupIndex];
  
  // Group Admin이 자신이 생성한 그룹만 삭제할 수 있고, Super Admin은 모든 그룹을 삭제할 수 있음
  if (user.roles.includes('Super Admin') || (user.roles.includes('Group Admin') && group.creator === user.username)) {
    groups.splice(groupIndex, 1);  // 그룹 삭제
    saveFile(groupsFilePath, groups);  // 삭제 후 파일에 저장
    res.status(200).json({ message: 'Group deleted successfully' });
  } else {
    res.status(403).json({ error: 'You do not have permission to delete this group.' });
  }
});

// 그룹 내 채널 조회
app.get('/api/groups/:groupId/channels', async (req, res) => {
  const { groupId } = req.params;  // URL에서 groupId를 가져옴
  console.log(`Fetching channels for groupId: ${groupId}`);  // 로그 추가

  try {
    // MongoDB에서 groupId에 해당하는 채널 찾기
    const groupChannels = await Channel.find({ groupId });

    if (!groupChannels || groupChannels.length === 0) {
      return res.status(404).json({ message: 'No channels found for this group.' });
    }

    // 채널이 있으면 응답으로 반환
    res.json(groupChannels);
  } catch (error) {
    console.error('Error fetching group channels:', error);
    res.status(500).json({ message: 'Error fetching group channels' });
  }
});



// 채널 삭제
app.delete('/api/groups/:groupId/channels/:channelId', async (req, res) => {
  const { groupId, channelId } = req.params;

  // 사용자 정보를 헤더에서 가져옴. 헤더가 비어 있으면 오류 반환.
  const userHeader = req.headers.user;
  
  if (!userHeader) {
    return res.status(400).json({ error: 'User information missing in headers.' });
  }

  let user;
  try {
    user = JSON.parse(userHeader);  // JSON 문자열을 객체로 파싱
  } catch (err) {
    return res.status(400).json({ error: 'Invalid user information in headers.' });
  }

  try {
    // MongoDB에서 해당 채널을 찾음
    const channel = await Channel.findOne({ id: channelId, groupId });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Super Admin 또는 Group Admin이 생성한 채널만 삭제 가능
    if (user.roles.includes('Super Admin') || (user.roles.includes('Group Admin') && channel.creator === user.username)) {
      // MongoDB에서 채널 삭제
      await Channel.deleteOne({ id: channelId, groupId });
      return res.status(200).json({ message: 'Channel deleted successfully' });
    } else {
      return res.status(403).json({ error: 'You do not have permission to delete this channel.' });
    }
  } catch (error) {
    console.error('Error deleting channel:', error);
    return res.status(500).json({ error: 'An error occurred while deleting the channel' });
  }
});


// 사용자 삭제 

app.delete('/api/users/delete/:id', (req, res) => {
  const userId = req.params.id;  // 문자열로 처리
  const userIndex = users.findIndex(u => u.id === userId);  // 문자열로 비교

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(userIndex, 1);
  saveFile(usersFilePath, users);
  res.json({ success: true });
});


// Super Admin이 사용자 삭제
app.delete('/api/super-admin/delete/:id', (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(userIndex, 1);
  saveFile(usersFilePath, users);
  res.json({ success: true });
});

// 그룹 멤버 조회 API
app.get('/api/groups/:groupId/members', (req, res) => {
  const { groupId } = req.params;

  // 해당 그룹에 속한 사용자 필터링
  const members = users.filter(user => user.groups.some(group => group.groupId === groupId && group.status === 'Accepted'));

  // 멤버의 firstName과 lastName만 반환
  const memberNames = members.map(member => ({
    firstName: member.firstName,
    lastName: member.lastName,
  }));

  res.json(memberNames);
});



// 그룹 초대 API
app.post('/api/groups/:groupId/invite', (req, res) => {
  const { email } = req.body;
  const groupId = req.params.groupId;

  // 그룹 및 사용자 확인
  const group = groups.find(g => g.id === groupId);
  const user = users.find(u => u.email === email);

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // 이미 그룹에 속해 있는지 확인
  const userGroup = user.groups.find(g => g.groupId === groupId);
  if (userGroup && userGroup.status === 'Pending') {
    addNotification(user.id, `You have already been invited to join group ${group.name}. Please accept the invitation.`);
    return res.status(200).json({ message: 'Reminder sent to user.' });
  }

  if (!userGroup) {
    user.groups.push({ groupId, status: 'Pending' });
    saveFile(usersFilePath, users); // 파일 저장
  }

  addNotification(user.id, `You have been invited to join group ${group.name}.`);
  res.status(200).json({ message: 'User invited successfully.' });
});

// 그룹 참여 수락 API (모든 사용자 즉시 가입)
app.post('/api/groups/:groupId/join', (req, res) => {
  const groupId = req.params.groupId;
  const { userId } = req.body;

  // 유저 정보 확인
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // 그룹 정보 확인
  const group = groups.find(g => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  // 이미 그룹에 속해 있는지 확인
  const existingGroup = user.groups.find(g => g.groupId === groupId);
  if (!existingGroup) {
    // 새로운 그룹 추가, 상태는 'Accepted'로 설정
    user.groups.push({ groupId, status: 'Accepted' });
    saveFile(usersFilePath, users); // 파일에 저장

    // 터미널에 로그 출력
    console.log(`${user.username} has joined the group ${group.name} (Accepted)`);

    return res.json({ success: true, message: `${user.username} has joined the group ${group.name}` });
  }

  return res.status(400).json({ error: 'User is already in the group.' });
});



app.post('/api/groups/:groupId/approve/:userId', (req, res) => {
  const { groupId, userId } = req.params;

  // 그룹 및 사용자 확인
  const group = groups.find(g => g.id === groupId);
  const user = users.find(u => u.id === userId);

  if (!group || !user) {
    return res.status(404).json({ error: 'Group or user not found' });
  }

  // 유저의 그룹 상태 확인 및 업데이트
  const userGroup = user.groups.find(g => g.groupId === groupId && g.status === 'Pending');
  if (userGroup) {
    userGroup.status = 'Accepted';  // 상태를 Accepted로 변경
    saveFile(usersFilePath, users);  // 업데이트된 사용자 정보 저장

    // 가입 승인 알림 전송
    addNotification(user.id, `Your request to join the group ${group.name} has been approved.`);
    return res.json({ success: true, message: `User ${user.username} has been approved to join group ${group.name}` });
  } else {
    return res.status(400).json({ error: 'No pending request found for this user.' });
  }
});

// 사용자 이메일 검색 API
app.get('/api/users/search', (req, res) => {
  const { email } = req.query;  // 쿼리로 이메일을 받아옴

  if (!email) {
    return res.status(400).json({ error: 'Email query is required' });
  }

  // 이메일을 포함하는 사용자를 검색
  const matchingUsers = users.filter(u => u.email.includes(email));

  if (matchingUsers.length === 0) {
    return res.status(404).json({ error: 'No users found' });
  }

  // 검색된 사용자의 이름과 이메일만 반환
  const result = matchingUsers.map(user => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  }));

  res.json(result);
});


// MongoDB로 채널 데이터를 관리하는 API
app.post('/api/channels', async (req, res) => {
  const { name, description } = req.body;
  const newChannelId = Date.now().toString();  // 고유한 ID로 타임스탬프를 사용

  try {
    const newChannel = new Channel({ id: newChannelId, name, description });
    console.log('Creating new channel:', newChannel);
    await newChannel.save();
    console.log('Channel saved:', newChannel);
    res.status(201).json(newChannel);
  } catch (error) {
    res.status(500).json({ message: 'Error creating channel', error });
  }
});




// MongoDB에서 특정 채널의 메시지를 가져오는 API
// MongoDB에서 특정 채널의 메시지를 가져오는 API
app.get('/api/channels/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;
  console.log(`Fetching messages for channel: ${channelId}`);
  
  try {
    // MongoDB에서 채널을 ID로 찾음
    const channel = await Channel.findOne({ id: channelId });
    
    if (!channel) {
      console.log('Channel not found, returning 404');
      return res.status(404).json({ message: 'Channel not found' });
    }
    
    // 채널의 메시지 배열을 반환
    return res.status(200).json(channel.messages);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return res.status(500).json({ message: 'Error retrieving messages', error });
  }
});





// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


