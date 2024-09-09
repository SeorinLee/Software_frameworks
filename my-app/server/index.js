const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 4002;

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

const usersFilePath = path.join(__dirname, 'users.json');
const notificationsFilePath = path.join(__dirname, 'notifications.json');
const groupsFilePath = path.join(__dirname, 'groups.json');
const channelsFilePath = path.join(__dirname, 'channels.json');

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

let users = loadFile(usersFilePath);
let notifications = loadFile(notificationsFilePath);
let groups = loadFile(groupsFilePath);
let channels = loadFile(channelsFilePath);

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

// 특정 사용자 알림 조회
app.get('/api/notifications/:id', (req, res) => {
  const userId = req.params.id;
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
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    const username = user.username;
    let role = '';
    if (username.startsWith('s')) {
      role = 'Super Admin';
    } else if (username.startsWith('g')) {
      role = 'Group Admin';
    } else if (username.startsWith('u')) {
      role = 'User';
    }

    user.roles = [role];
    res.json(user);
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

  const { firstName, lastName, email, dob } = req.body;
  if (firstName) users[userIndex].firstName = firstName;
  if (lastName) users[userIndex].lastName = lastName;
  if (email) users[userIndex].email = email;
  if (dob) users[userIndex].dob = dob;

  saveFile(usersFilePath, users);
  res.json({ success: true, user: users[userIndex] });
});

// 사용자 삭제 (Super Admin)
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


// 그룹 생성
app.post('/api/groups', (req, res) => {
  const { id, name, description, creator } = req.body;

  if (!id || !name || !description || !creator) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (groups.some(group => group.id === id)) {
    return res.status(400).json({ error: 'Group ID already exists' });
  }

  const creatorUser = users.find(u => u.username === creator);
  const creatorName = creatorUser ? `${creatorUser.firstName} ${creatorUser.lastName}` : 'Unknown';

  const newGroup = { id, name, description, creator, creatorName };
  groups.push(newGroup);
  saveFile(groupsFilePath, groups);

  res.status(201).json(newGroup);
});

// 그룹 삭제
app.delete('/api/groups/:id', (req, res) => {
  const groupId = req.params.id;
  const userHeader = req.headers.user;

  if (!userHeader) {
    return res.status(400).json({ error: 'User information missing in headers.' });
  }

  let user;
  try {
    user = JSON.parse(userHeader);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid user information in headers.' });
  }

  const groupIndex = groups.findIndex(group => group.id === groupId);

  if (groupIndex === -1) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const group = groups[groupIndex];

  if (user.roles.includes('Super Admin') || (user.roles.includes('Group Admin') && group.creator === user.username)) {
    groups.splice(groupIndex, 1);
    saveFile(groupsFilePath, groups);
    res.status(200).json({ message: 'Group deleted successfully' });
  } else {
    res.status(403).json({ error: 'You do not have permission to delete this group.' });
  }
});

// 그룹 조회
app.get('/api/groups', (req, res) => {
  const userHeader = req.headers.user;
  let user;
  try {
    user = JSON.parse(userHeader);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid user information in headers.' });
  }

  const userGroups = user.roles.includes('Super Admin') ? groups : groups.filter(group => group.creator === user.username);
  res.json(userGroups);
});

// 특정 그룹 조회
app.get('/api/groups/:id', (req, res) => {
  const group = groups.find(group => group.id === req.params.id);

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  res.json(group);
});

// 채널 생성
app.post('/api/groups/:groupId/channels', (req, res) => {
  const { groupId } = req.params;
  const { id, name, description, creator } = req.body;

  if (!id || !name || !description || !creator) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (channels.some(channel => channel.id === id)) {
    return res.status(400).json({ error: 'Channel ID already exists' });
  }

  const newChannel = { id, name, description, groupId, creator };
  channels.push(newChannel);
  saveFile(channelsFilePath, channels);

  res.status(201).json(newChannel);
});

// 채널 삭제
app.delete('/api/groups/:groupId/channels/:channelId', (req, res) => {
  const { groupId, channelId } = req.params;
  const userHeader = req.headers.user;

  if (!userHeader) {
    return res.status(400).json({ error: 'User information missing in headers.' });
  }

  let user;
  try {
    user = JSON.parse(userHeader);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid user information in headers.' });
  }

  const channelIndex = channels.findIndex(channel => channel.id === channelId && channel.groupId === groupId);

  if (channelIndex === -1) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const channel = channels[channelIndex];

  if (user.roles.includes('Super Admin') || (user.roles.includes('Group Admin') && channel.creator === user.username)) {
    channels.splice(channelIndex, 1);
    saveFile(channelsFilePath, channels);
    res.status(200).json({ message: 'Channel deleted successfully' });
  } else {
    res.status(403).json({ error: 'You do not have permission to delete this channel.' });
  }
});

// 그룹 멤버 조회 API
app.get('/api/groups/:groupId/members', (req, res) => {
  const { groupId } = req.params;
  const members = users.filter(user => user.groups.includes(groupId));
  res.json(members);
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
