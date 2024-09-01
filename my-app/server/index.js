const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 4002;

app.use(bodyParser.json());

const users = [
  {
    id: '1',
    username: 'super1',
    password: 'super123',
    name: 'Super Admin',
    email: 'super@example.com',
    roles: ['Super Admin'],
    groups: []
  },
  {
    id: '2',
    username: 'group1',
    password: 'group123',
    name: 'Group Admin',
    email: 'group@example.com',
    roles: ['Group Admin'],
    groups: []
  },
  {
    id: '3',
    username: 'user1',
    password: 'user123',
    name: 'User',
    email: 'user@example.com',
    roles: ['User'],
    groups: []
  }
];

// JSON 요청을 처리할 수 있게 해줌
app.use(cors());
app.use(express.json());

// 간단한 라우트 설정
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// 로그인 엔드포인트
app.post('/api/auth', (req, res) => {
  const { username, password } = req.body; // email 대신 username 사용
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json(user);
  } else {
    res.status(401).send('Invalid username or password'); // 오류 메시지 업데이트
  }
});

// 회원가입 엔드포인트
app.post('/api/register', (req, res) => {
  console.log(req.body); // 이 부분 추가
  const { username, password, name, email, roles, groups, id, dob } = req.body;

  // 동일한 사용자 이름으로 이미 등록된 사용자가 있는지 확인
  if (users.find(u => u.username === username)) {
    console.log('Existing user check:', existingUser);
  }

  // 사용자 이름 형식 확인
  if (!username.startsWith('super') && !username.startsWith('group') && !username.startsWith('user')) {
    this.errorMessage = 'Username must start with "super", "group", or "user".';
    return; // 서버에 요청을 보내지 않고 함수 종료
  }

  // 새로운 사용자 생성
  const newUser = {
    id: id || (users.length + 1).toString(), // ID는 수동 입력 혹은 자동 생성
    username,
    password,
    name,
    email,
    roles: roles || ['User'], // 기본 역할은 'User'
    groups: groups || [],
    dob,
  };

  // 사용자 배열에 추가
  users.push(newUser);

  // 성공적으로 추가된 사용자 반환
  res.status(201).json({ success: true, user: newUser });
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
