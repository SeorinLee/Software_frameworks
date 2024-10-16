const http = require('http');
const socketIO = require('socket.io');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 4002;
const mongoose = require('mongoose');
const User = require('./models/User');  // 모델 불러오기
const Channel = require('./models/Channel');  // Channel 모델 추가
const bcrypt = require('bcrypt');
const multer = require('multer');
const server = http.createServer(app);  // Express 서버에 HTTP 서버 연결
const io = socketIO(server, {
  path: '/socket.io',  // 기본 소켓 경로
  cors: {
    origin: "http://localhost:4200", // 클라이언트 주소
    methods: ["GET", "POST"],
    credentials: true
  }
});

// channels 변수를 한 번만 선언합니다.
const channels = {};  // 각 채널별로 유저를 관리하는 객체

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

    // WebRTC Offer 이벤트 처리
    socket.on('offer', (data) => {
      socket.to(data.channelId).emit('offer', data.offer);
    });
  
    // WebRTC Answer 이벤트 처리
    socket.on('answer', (data) => {
      socket.to(data.channelId).emit('answer', data.answer);
    });
  
    // ICE Candidate 이벤트 처리
    socket.on('candidate', (data) => {
      socket.to(data.channelId).emit('candidate', data.candidate);
    });

  // 채널 참가 처리
  socket.on('joinChannel', async ({ channelId, username }) => {
    console.log(`${username} joined channel ${channelId}`);

    try {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        console.log('Channel not found');
        return;
      }

      // 유저를 채널에 추가
      if (!channel.members.includes(username)) {
        channel.members.push(username);
      }

      // 참가 로그에 추가
      channel.joinLog.push(username);

      // MongoDB에 변경사항 저장
      await channel.save();

      // 소켓을 채널에 가입시키고, 업데이트된 멤버 리스트 전송
      socket.join(channelId);
      io.to(channelId).emit('membersUpdate', channel.members);
      console.log('Members in channel:', channel.members);
    } catch (err) {
      console.error('Error joining channel:', err);
    }
  });

  // 채널 퇴장 처리
  socket.on('leaveChannel', async ({ channelId, username }) => {
    console.log(`${username} left channel ${channelId}`);
    try {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        console.log('Channel not found');
        return;
      }

      // 유저를 채널에서 제거
      channel.members = channel.members.filter(member => member !== username);

      // 퇴장 로그에 추가
      channel.leaveLog.push(username);

      // MongoDB에 변경사항 저장
      await channel.save();

      // 소켓을 채널에서 나가게 하고, 업데이트된 멤버 리스트 전송
      socket.leave(channelId);
      io.to(channelId).emit('membersUpdate', channel.members);
      console.log('Members after leaving:', channel.members);
    } catch (err) {
      console.error('Error leaving channel:', err);
    }
  });

  // 메시지 전송 처리
  socket.on('sendMessage', async ({ channelId, username, message, fileUrl, fileType }) => {
    try {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        console.log('Channel not found');
        return;
      }

   // 사용자 정보를 MongoDB에서 가져와서 프로필 사진 URL을 포함
   const user = await User.findOne({ username: username });
   const profilePictureUrl = user && user.profilePictureUrl ? user.profilePictureUrl : 'images/chatlogo.png';  // 기본 프로필 사진 설정

   // 새로운 메시지 생성, 파일만 업로드할 경우 message는 빈 문자열로
   const newMessage = {
     username,
     message: message || '',  // 메시지가 없는 경우 빈 문자열
     fileUrl: fileUrl || '',  // 파일 URL이 있을 경우만 추가
     fileType: fileType || '',  // 파일 타입이 있을 경우만 추가
     profilePictureUrl,  // 프로필 사진 URL 추가
     timestamp: new Date()
   };

  
      // 메시지 저장
      channel.messages.push(newMessage);
      await channel.save();
  
      // 클라이언트에게 메시지 전송
      io.to(channelId).emit('newMessage', newMessage);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  });
  

  // 사용자 연결 해제 처리
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});




app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
// 정적 파일 제공 (업로드된 이미지 접근)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const usersFilePath = path.join(__dirname, 'users.json');
const notificationsFilePath = path.join(__dirname, 'notifications.json');
const groupsFilePath = path.join(__dirname, 'groups.json');
const channelsFilePath = path.join(__dirname, 'channels.json');


// CORS 설정
app.use(cors({
  origin: 'http://localhost:4200',  // Angular 애플리케이션이 실행되는 도메인
  credentials: true,  // 쿠키를 포함한 자격 증명을 허용
}));

// MongoDB 연결 설정
const mongoURI = 'mongodb://localhost:27017/chatApp'; // MongoDB URL을 'chatApp' 데이터베이스로 변경
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected to chatApp...'))
  .catch(err => console.log(err));


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

// Multer 설정 (이미지 저장 경로 및 파일 이름 설정)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // 'uploads' 폴더에 저장
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  // 원래 파일명을 포함하여 파일명 생성
  }
});
const upload = multer({ storage: storage });

const mime = require('mime-types');  // MIME 타입을 구분하기 위한 패키지

// 채팅 이미지/비디오 파일 업로드 엔드포인트
app.post('/api/channels/:channelId/upload', cors(), upload.single('file'), async (req, res) => {
  const { channelId } = req.params;
  const { message, username } = req.body;
  const fileType = req.file ? (req.file.mimetype.startsWith('image') ? 'image' : 'video') : null; // 파일 타입 확인

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // 업로드된 파일 URL을 메시지로 저장 (파일이 있을 때만)
    const newMessage = {
      username: username,
      message: message || '',  // 텍스트 메시지
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,  // 파일 URL (없으면 null)
      fileType: fileType,  // 파일 타입 (없으면 null)
      timestamp: new Date()
    };

    channel.messages.push(newMessage);
    await channel.save();

    io.to(channelId).emit('newMessage', newMessage);
    res.json({ message: 'File and message uploaded successfully', fileUrl: newMessage.fileUrl, fileType: newMessage.fileType });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload file and message' });
  }
});

app.get('/api/channels/:channelId/messages', async (req, res) => {
  console.log("Requested channelId:", req.params.channelId);  // 요청된 채널 ID 확인
  const { channelId } = req.params;

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      console.log("Channel not found");
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json(channel.messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});



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

// 모든 사용자 목록 조회 (Super Admin 전용)
app.get('/api/users',  async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users from MongoDB' });
  }
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
app.post('/api/auth', async (req, res) => {
  const { email, password } = req.body;

  try {
    // MongoDB에서 사용자 조회
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

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
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});


// 사용자 회원가입
app.post('/api/register', async (req, res) => {
  const { username, password, firstName, lastName, email, dob } = req.body;

  if (!username || !password || !firstName || !lastName || !email || !dob) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // 중복 이메일 확인 (MongoDB)
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 역할 설정
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

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // MongoDB에 저장할 새 유저 생성
    const newUser = new User({
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      roles,
      dob
    });

    // MongoDB에 유저 저장
    await newUser.save();

    // JSON 파일에 저장할 유저 데이터
    const jsonUser = {
      id: (users.length + 1).toString(),  // ID를 JSON의 기존 유저 길이로 설정
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      roles,
      groups: [],
      dob
    };

    // JSON 파일에 저장
    users.push(jsonUser);
    saveFile(usersFilePath, users);  // 기존의 saveFile 함수로 JSON 파일에 저장

    res.status(201).json({ success: true, user: jsonUser });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});


// 사용자 정보 요청 (프로필 데이터)
app.get('/api/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(new mongoose.Types.ObjectId(userId)); // MongoDB에서 사용자 찾기
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});


app.put('/api/users/:id/profile', upload.single('profilePicture'), async (req, res) => {
  const userId = req.params.id;

  try {
    // 사용자 찾기
    const user = await User.findById(new mongoose.Types.ObjectId(userId)); // MongoDB에서 사용자 찾기
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 이미지가 있으면 프로필 사진 URL 저장
    if (req.file) {
      user.profilePictureUrl = `/uploads/${req.file.filename}`;  // 파일 경로 저장
    }

    // 다른 사용자 정보 업데이트
    const updatedUser = JSON.parse(req.body.userData);
    user.firstName = updatedUser.firstName || user.firstName;
    user.lastName = updatedUser.lastName || user.lastName;
    user.email = updatedUser.email || user.email;

    await user.save();  // MongoDB에 저장

    res.json({ profilePictureUrl: user.profilePictureUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


// 사용자 역할 변경을 수락하는 API
app.post('/api/accept-promotion/:id', async (req, res) => {
  const userId = req.params.id;
  let { newRole } = req.body;

  console.log('Received newRole:', `"${newRole}"`); // 디버깅용 로그

  // 공백 제거 및 소문자로 변환하여 처리
  newRole = newRole.trim().toLowerCase();

  // MongoDB에서 사용자 찾기
  try {
    const user = await User.findById(userId); // MongoDB에서 사용자 찾기
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 역할 매핑
    const roleMapping = {
      'super admin': 'Super Admin',
      'group admin': 'Group Admin',
      'user': 'User'
    };

    if (!roleMapping[newRole]) {
      console.error('Invalid role specified on server:', newRole); // 디버깅 로그
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const rolePrefixMapping = {
      'Super Admin': 's',
      'Group Admin': 'g',
      'User': 'u'
    };

    const newRoleFormatted = roleMapping[newRole]; // 대문자로 포맷팅된 역할
    const rolePrefix = rolePrefixMapping[newRoleFormatted];

    // MongoDB에서 사용자 역할 업데이트
    user.roles = [newRoleFormatted];
    user.username = `${rolePrefix}${user.username.replace(/^(s|g|u)/, '')}`;

    // MongoDB에 저장
    await user.save();

    // JSON 파일에 반영
    const userIndexInJson = users.findIndex(u => u._id === userId);
    if (userIndexInJson !== -1) {
      users[userIndexInJson].roles = [newRoleFormatted];
      users[userIndexInJson].username = user.username;
      saveFile(usersFilePath, users); // JSON 파일 저장
    }

    // 알림에서 해당 유저 알림 삭제
    notifications[userId] = [];
    saveFile(notificationsFilePath, notifications); // JSON 파일에 알림 저장

    res.json({ success: true, newUsername: user.username, newRole: user.roles[0] });
  } catch (err) {
    console.error(`Error updating user role for ID ${userId}:`, err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});



// 그룹 생성
app.post('/api/groups', async (req, res) => {
  const { name, description, creator } = req.body; // Group ID를 더 이상 받지 않음

  if (!name || !description || !creator) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // MongoDB에서 생성자 찾기
    const creatorUser = await User.findOne({ username: creator });

    if (!creatorUser) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const creatorName = `${creatorUser.firstName} ${creatorUser.lastName}`;

    // Group ID를 MongoDB ObjectId로 자동 생성
    const newGroup = {
      id: new mongoose.Types.ObjectId().toString(), // 자동 생성된 ObjectId 사용
      name,
      description,
      creator,
      creatorName,
    };

    groups.push(newGroup);
    saveFile(groupsFilePath, groups);

    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'An error occurred while creating the group.' });
  }
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
  res.json(groups); // 모든 그룹을 반환
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
app.post('/api/groups/:groupId/channels', async (req, res) => {
  const { groupId } = req.params;
  const { name, description, creator } = req.body;

  if (!name || !description || !creator) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // 새로운 채널을 MongoDB에 저장
    const newChannel = new Channel({
      name,
      description,
      groupId,
      creator,
    });

    await newChannel.save();
    res.status(201).json(newChannel);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create channel' });
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
  const { groupId } = req.params;
  const userHeader = req.headers.user;
  
  if (!userHeader) {
    return res.status(400).json({ error: 'User information missing in headers.' });
  }

  let user;
  try {
    user = JSON.parse(userHeader);  // JSON 파싱
  } catch (err) {
    return res.status(400).json({ error: 'Invalid user information in headers.' });
  }

  try {
    // Super Admin이면 모든 채널을, Group Admin이면 자신이 생성한 채널만 조회
    const query = user.roles.includes('Super Admin') 
      ? { groupId } 
      : { groupId, creator: user.username };  // 그룹 ID와 생성자가 자신인 채널만 조회
    const groupChannels = await Channel.find(query);

    res.json(groupChannels);
  } catch (err) {
    console.error('Error fetching channels:', err);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// 그룹 내 모든 채널 조회 (권한과 상관없이 모든 채널 반환)
app.get('/api/groups/:groupId/all-channels', async (req, res) => {
  const { groupId } = req.params;
  
  try {
    // 해당 그룹의 모든 채널을 조회
    const groupChannels = await Channel.find({ groupId });

    if (!groupChannels || groupChannels.length === 0) {
      return res.status(404).json({ error: 'No channels found for this group' });
    }

    res.json(groupChannels);
  } catch (err) {
    console.error('Error fetching channels:', err);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});



// 채널 삭제
app.delete('/api/groups/:groupId/channels/:channelId', async (req, res) => {
  const { groupId, channelId } = req.params;
  const userHeader = req.headers.user;

  if (!userHeader) {
    return res.status(400).json({ error: 'User information missing in headers.' });
  }

  let user;
  try {
    user = JSON.parse(userHeader);  // JSON 파싱
  } catch (err) {
    return res.status(400).json({ error: 'Invalid user information in headers.' });
  }

  try {
    // Super Admin이거나, Group Admin이면서 자신이 생성한 채널인 경우에만 삭제 가능
    const query = user.roles.includes('Super Admin') 
      ? { _id: channelId, groupId }  // MongoDB는 _id를 사용하므로 id 대신 _id로 변경
      : { _id: channelId, groupId, creator: user.username };  // 그룹 ID와 생성자가 본인인 경우만 삭제 가능

    const channel = await Channel.findOneAndDelete(query);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found or permission denied' });
    }

    res.status(200).json({ message: 'Channel deleted successfully' });
  } catch (err) {
    console.error('Error deleting channel:', err);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});


// 채널 참여
app.post('/api/groups/:groupId/channels/:channelId/join', async (req, res) => {
  let { channelId } = req.params;
  const userHeader = req.headers.user;

  if (!userHeader) {
    return res.status(400).json({ error: 'User information missing in headers.' });
  }

  let user;
  try {
    user = JSON.parse(userHeader);  // 사용자 정보 파싱
  } catch (err) {
    return res.status(400).json({ error: 'Invalid user information in headers.' });
  }

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(400).json({ error: 'Invalid channel ID' });
  }

  channelId = new mongoose.Types.ObjectId(channelId);  // ObjectId로 변환

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // 채널의 members가 undefined인 경우 빈 배열로 초기화
    if (!channel.members) {
      channel.members = [];
    }

    // 사용자가 이미 채널에 참가했는지 확인
    if (channel.members.includes(user.username)) {
      return res.status(400).json({ error: 'User already joined the channel' });
    }

    // 유저를 members에 추가
    channel.members.push(user.username);
    await channel.save();

    res.status(200).json({ message: 'Successfully joined the channel', members: channel.members });
  } catch (err) {
    console.error('Error joining channel:', err);
    res.status(500).json({ error: 'Failed to join the channel' });
  }
});

// 특정 채널 정보 (참가한 유저 목록 및 참가 메시지 반환)
app.get('/api/channels/:channelId', async (req, res) => {
  const { channelId } = req.params;

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // 참가한 유저 목록과 최근 참가 메시지 반환
    res.status(200).json({
      members: channel.members,
    });
  } catch (err) {
    console.error('Error fetching channel data:', err);
    res.status(500).json({ error: 'Failed to fetch channel data' });
  }
});

// 채널 퇴장
app.post('/api/channels/:channelId/exit', async (req, res) => {
  const { channelId } = req.params;
  const userHeader = req.headers.user;

  if (!userHeader) {
    return res.status(400).json({ error: 'User information missing in headers.' });
  }

  let user;
  try {
    user = JSON.parse(userHeader);  // 사용자 정보 파싱
  } catch (err) {
    return res.status(400).json({ error: 'Invalid user information in headers.' });
  }

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(400).json({ error: 'Invalid channel ID' });
  }

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // 채널에서 유저 제거
    const memberIndex = channel.members.indexOf(user.username);
    if (memberIndex !== -1) {
      channel.members.splice(memberIndex, 1);
      await channel.save();

      res.status(200).json({
        message: 'Successfully exited the channel',
        exitMessage: `Exit, thank you `,  // 퇴장 메시지
        members: channel.members
      });
    } else {
      res.status(400).json({ error: 'User not found in the channel' });
    }
  } catch (err) {
    console.error('Error exiting channel:', err);
    res.status(500).json({ error: 'Failed to exit the channel' });
  }
});


// Super Admin이 사용자 역할을 변경하는 API (알림 전송 포함)
app.put('/api/super-admin/promote/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // MongoDB ObjectId로 변환하여 사용자 찾기
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (!user) {
      return res.status(404).json({ error: `User with ID ${userId} not found` });
    }

    const newRole = req.body.newRole;
    if (!['Super Admin', 'Group Admin', 'User'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // 역할 업데이트
    user.roles = [newRole];  
    await user.save();  // MongoDB에 저장

    // 알림 메시지 생성
    const notificationMessage = `Your role has been changed to ${newRole}. Please accept the promotion in your notifications.`;

    // notifications.json 파일에 사용자 알림 추가
    if (!notifications[userId]) {
      notifications[userId] = [];
    }

    notifications[userId].push({
      message: notificationMessage,
      timestamp: new Date().toISOString(),
    });

    // notifications.json 파일 저장
    saveFile(notificationsFilePath, notifications);

    res.json({ success: true, message: `User ${user.username} promoted to ${newRole}. Notification sent.` });
  } catch (err) {
    console.error(`Failed to promote user with ID ${userId}:`, err);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});




// 사용자 삭제
app.delete('/api/super-admin/delete/:id', async (req, res) => {
  const userId = req.params.id;

  // userId 검증
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error(`Invalid userId: ${userId}`);
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User with ID ${userId} not found.`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Super Admin 자신을 삭제하는 것을 방지
    if (user.roles.includes('Super Admin')) {
      console.log(`Attempted to delete Super Admin: ${user.username}`);
      return res.status(403).json({ error: 'Super Admin cannot delete themselves.' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error(`Failed to delete user with ID ${userId}:`, err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
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

// 모든 유저 리스트 조회 API (Group Admin 또는 Super Admin만 접근 가능)
app.get('/api/users/all', async (req, res) => {
  const userHeader = req.headers.user;
  if (!userHeader) {
    return res.status(400).json({ error: 'User information missing in headers.' });
  }

  let user;
  try {
    user = JSON.parse(userHeader);  // 사용자 정보 파싱
  } catch (err) {
    return res.status(400).json({ error: 'Invalid user information in headers.' });
  }

  // Super Admin 또는 Group Admin만 모든 유저를 조회할 수 있음
  if (!user.roles.includes('Super Admin') && !user.roles.includes('Group Admin')) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  try {
    // MongoDB에서 모든 유저 정보 조회
    const users = await User.find({}, { _id: 1, firstName: 1, lastName: 1, email: 1 }); // 필요한 필드만 가져옴
    res.json(users);
  } catch (err) {
    console.error('Error fetching users from MongoDB:', err);
    res.status(500).json({ error: 'Failed to fetch users from MongoDB' });
  }
});



// 서버 실행
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});