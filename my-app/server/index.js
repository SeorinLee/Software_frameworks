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

// 사용자 로그인
app.post('/api/auth', (req, res) => {
  const { username, password } = req.body;
  
  // 정확히 username과 password가 일치하는 사용자 찾기
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // 로그인 성공 시 사용자 정보를 반환 (roles 포함)
    res.json(user);
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});


// 사용자 회원가입
app.post('/api/register', (req, res) => {
  const { username, password, name, email, roles, groups, dob } = req.body;

  if (users.some(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const newUser = {
    id: (users.length + 1).toString(),
    username,
    password,
    name,
    email,
    roles: roles || ['User'],
    groups: groups || [],
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

  users[userIndex] = { ...users[userIndex], ...req.body };
  saveFile(usersFilePath, users);

  res.json({ success: true, user: users[userIndex] });
});

// Super Admin이 사용자 역할을 변경
app.put('/api/super-admin/promote/:id', (req, res) => {
  const userId = req.params.id;
  const { newRole } = req.body;
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updatedUser = users[userIndex];
  if (!updatedUser.roles.includes(newRole)) {
    updatedUser.roles.push(newRole);
  }

  saveFile(usersFilePath, users);
  addNotification(userId, `Your role has been upgraded to ${newRole}.`);

  res.json({ success: true, user: updatedUser });
});

// 사용자 역할 변경 수락
app.post('/api/accept-promotion/:id', (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  let user = users[userIndex];
  const rolePrefix = user.roles.includes('Super Admin') ? 'super' : 'group';
  user.username = `${rolePrefix}${user.username.replace(/^(super|group)/, '')}`;

  saveFile(usersFilePath, users);
  notifications[userId] = [];  // 알림 삭제
  saveFile(notificationsFilePath, notifications);

  res.json({ success: true, newUsername: user.username });
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
  const { user } = req.body;
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
  const user = JSON.parse(req.headers.user);
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
  const { user } = req.body;
  const channelIndex = channels.findIndex(channel => channel.id === channelId && channel.groupId === groupId);

  if (channelIndex === -1) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const channel = channels[channelIndex];
  if (user.roles.includes('Group Admin') && channel.creator !== user.username) {
    return res.status(403).json({ error: 'You do not have permission to delete this channel.' });
  }

  channels.splice(channelIndex, 1);
  saveFile(channelsFilePath, channels);

  res.status(200).json({ message: 'Channel deleted successfully' });
});

// 그룹 내 채널 조회
// 그룹 내 채널 조회 API
app.get('/api/groups/:groupId/channels', (req, res) => {
  const { groupId } = req.params;
  
  // 해당 그룹의 채널을 필터링
  const groupChannels = channels.filter(channel => channel.groupId === groupId);

  // 채널이 없을 경우 빈 배열을 반환
  if (!groupChannels) {
    return res.status(404).json({ message: 'No channels found for this group' });
  }

  // 유효한 데이터로 응답
  res.json(groupChannels);
});

// 사용자 삭제 (Super Admin)
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
  const members = users.filter(user => user.groups.includes(groupId));
  res.json(members);
});

// 그룹 채널 조회 API
app.get('/api/groups/:groupId/channels', (req, res) => {
  const { groupId } = req.params;
  const groupChannels = channels.filter(channel => channel.groupId === groupId);
  res.json(groupChannels);
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
