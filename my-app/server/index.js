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

// 사용자 데이터를 저장할 JSON 파일 경로
const usersFilePath = path.join(__dirname, 'users.json');

// 알림을 저장할 JSON 파일 경로
const notificationsFilePath = path.join(__dirname, 'notifications.json');

// 사용자 데이터 로드
function loadUsers() {
  if (fs.existsSync(usersFilePath)) {
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
  }
  return [];
}

// 알림 데이터 로드
function loadNotifications() {
  if (fs.existsSync(notificationsFilePath)) {
    const data = fs.readFileSync(notificationsFilePath);
    return JSON.parse(data);
  }
  return {}; // 알림 데이터가 없는 경우 빈 객체 반환
}

// 사용자 데이터 저장
function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// 알림 데이터 저장
function saveNotifications(notifications) {
  fs.writeFileSync(notificationsFilePath, JSON.stringify(notifications, null, 2));
}

// 사용자 배열을 파일에서 로드
let users = loadUsers();
let notifications = loadNotifications();

// 사용자에 대한 알림 추가
function addNotification(userId, message) {
  if (!notifications[userId]) {
    notifications[userId] = [];
  }
  notifications[userId].push({ message, timestamp: new Date().toISOString() });
  saveNotifications(notifications);
}

// 서버 상태 확인 엔드포인트
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// 사용자 데이터를 반환하는 엔드포인트
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 특정 사용자에 대한 알림을 반환하는 엔드포인트
app.get('/api/notifications/:id', (req, res) => {
  const userId = req.params.id;
  const userNotifications = loadNotificationsForUser(userId);
  
  if (userNotifications.length > 0) {
    res.json(userNotifications);
  } else {
    res.status(404).json({ message: 'No notifications found' }); // JSON 형식으로 응답
  }
});

function loadNotificationsForUser(userId) {
  return notifications[userId] || []; // 사용자 ID에 따른 알림 반환
}

// 로그인 엔드포인트
app.post('/api/auth', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json(user);
  } else {
    res.status(401).send('Invalid username or password');
  }
});

// 회원가입 엔드포인트
app.post('/api/register', (req, res) => {
  const { username, password, name, email, roles, groups, dob } = req.body;

  if (users.find(u => u.username === username)) {
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
  saveUsers(users);

  res.status(201).json({ success: true, user: newUser });
});

// Super Admin이 사용자 역할을 변경할 수 있는 엔드포인트
app.put('/api/super-admin/promote/:id', (req, res) => {
  const userId = req.params.id;
  const { newRole } = req.body;

  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updatedUser = { ...users[userIndex] };
  if (!updatedUser.roles.includes(newRole)) {
    updatedUser.roles.push(newRole);
  }

  users[userIndex] = updatedUser;
  saveUsers(users);

  // 알림 추가
  addNotification(userId, `Your role has been upgraded to ${newRole}. Click to accept and use your new role's username.`);

  res.json({ success: true, user: updatedUser });
});

// 사용자 역할 승격을 수락할 때 호출되는 엔드포인트
app.post('/api/accept-promotion/:id', (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users[userIndex];
  const newUsernamePrefix = user.roles.includes('Super Admin') ? 'super' : 'group';
  const newUsername = `${newUsernamePrefix}${user.username.replace(/^user/, '')}`;

  // 새 사용자 이름 업데이트
  user.username = newUsername;
  saveUsers(users);

  // 알림 삭제
  notifications[userId] = [];
  saveNotifications(notifications);

  res.json({ success: true, newUsername });
});

// Super Admin이 사용자를 삭제할 수 있는 엔드포인트
app.delete('/api/super-admin/delete/:id', (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(userIndex, 1);
  saveUsers(users);

  res.json({ success: true });
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
