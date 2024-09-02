const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // 파일 시스템 모듈
const app = express();
const port = 4002;

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// 사용자 데이터를 저장할 JSON 파일 경로
const usersFilePath = path.join(__dirname, 'users.json');

// 사용자 데이터 로드
function loadUsers() {
  if (fs.existsSync(usersFilePath)) {
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
  }
  return [];
}

// 사용자 데이터 저장
function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// 사용자 배열을 파일에서 로드
let users = loadUsers();

// 서버 상태 확인 엔드포인트
app.get('/api/users', (req, res) => {
  res.send('Server is running!');
});

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

  // 동일한 사용자 이름으로 이미 등록된 사용자가 있는지 확인
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // 새로운 사용자 생성 (고유한 ID 포함)
  const newUser = {
    id: (users.length + 1).toString(), // 고유한 ID 자동 생성
    username,
    password,
    name,
    email,
    roles: roles || ['User'],
    groups: groups || [],
    dob,
  };

  users.push(newUser);
  saveUsers(users); // 변경 사항을 파일에 저장

  res.status(201).json({ success: true, user: newUser });
});

// 프로필 업데이트 엔드포인트 (프로필 사진 기능 제거)
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // 사용자 정보 업데이트
  try {
    const updatedUser = { ...users[userIndex], ...req.body };

    users[userIndex] = updatedUser;
    saveUsers(users); // 변경 사항을 파일에 저장

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(400).json({ error: 'Invalid user data format' });
  }
});

// 계정 삭제 엔드포인트
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(userIndex, 1);
  saveUsers(users); // 변경 사항을 파일에 저장

  res.json({ success: true });
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
