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

// CORS 설정
app.use(cors({
  origin: 'http://localhost:4200',  // Angular 애플리케이션이 실행되는 도메인
  credentials: true,  // 쿠키를 포함한 자격 증명을 허용
}));

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

//사용자(ID 기반)가 속한 그룹 정보
app.get('/api/users/:id/groups', (req, res) => {
  const userId = req.params.id;
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userGroups = user.groups || [];

  if (userGroups.length === 0) {
    return res.status(200).json({ groups: [] });  // 그룹이 없는 경우 빈 배열 반환
  }

  res.json({ groups: userGroups });
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
app.get('/api/groups/:groupId/channels', (req, res) => {
  const { groupId } = req.params;

  // 해당 그룹의 채널을 필터링
  const groupChannels = channels.filter(channel => channel.groupId === groupId);

  // 채널이 없을 경우 빈 배열을 반환
  res.json(groupChannels);
});

// 채널 삭제
app.delete('/api/groups/:groupId/channels/:channelId', (req, res) => {
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

  const channelIndex = channels.findIndex(channel => channel.id === channelId && channel.groupId === groupId);

  if (channelIndex === -1) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const channel = channels[channelIndex];

  // Group Admin이 자신이 생성한 채널만 삭제할 수 있음, Super Admin은 모든 채널 삭제 가능
  if (user.roles.includes('Super Admin') || (user.roles.includes('Group Admin') && channel.creator === user.username)) {
    channels.splice(channelIndex, 1);  // 채널 삭제
    saveFile(channelsFilePath, channels);  // 삭제 후 파일에 저장
    res.status(200).json({ message: 'Channel deleted successfully' });
  } else {
    res.status(403).json({ error: 'You do not have permission to delete this channel.' });
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
  const members = users.filter(user => user.groups.includes(groupId));
  res.json(members);
});

// 그룹 초대 API
app.post('/api/groups/:groupId/invite', (req, res) => {
  const { email, groupId } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.groups.some(g => g.groupId === groupId)) {
    user.groups.push({ groupId, status: 'Pending' });
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    addNotification(user.id, `You have been invited to join group ${groupId}.`);
    res.status(200).json({ message: 'User invited successfully.' });
  } else {
    res.status(400).json({ error: 'User is already in the group.' });
  }
});
// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


