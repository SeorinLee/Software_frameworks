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

// MongoDB에서 사용자 정보를 업데이트한 후, JSON 파일에 반영하는 함수
function updateUserInJsonFile(userId, updatedUser) {
  // JSON 파일에서 유저를 찾기
  let users = loadFile(usersFilePath);
  const userIndex = users.findIndex(user => user.id === userId);

  if (userIndex !== -1) {
    // 유저가 존재하는 경우, MongoDB에서 업데이트된 유저 정보를 JSON 파일에 반영
    users[userIndex] = {
      id: updatedUser._id.toString(),  // MongoDB ObjectId를 문자열로 변환
      username: updatedUser.username,
      password: updatedUser.password,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      roles: updatedUser.roles,
      groups: updatedUser.groups.map(group => ({
        groupId: group.groupId,
        status: group.status
      })),
      dob: updatedUser.dob.toISOString().split('T')[0]  // 날짜만 저장
    };

    // 변경된 데이터를 JSON 파일에 저장
    saveFile(usersFilePath, users);
    console.log(`User with ID ${userId} updated in users.json.`);
  } else {
    console.error(`User with ID ${userId} not found in users.json.`);
  }
}

// JSON 파일에 그룹 저장
function saveGroups(groups) {
  fs.writeFileSync(groupsFilePath, JSON.stringify(groups, null, 2));
}


let users = loadFile(usersFilePath);
let notifications = loadFile(notificationsFilePath);
let groups = loadFile(groupsFilePath);
let channels = loadFile(channelsFilePath);

// Multer 설정 (이미지 저장 경로 및 파일 이름 설정)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // 'uploads' 폴더에 저장
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // 현재 시간을 기준으로 파일명 생성
  }
});
const upload = multer({ storage: storage });

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

    const responseUser = {
      _id: user._id,
      username: user.username,
      roles: user.roles,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    res.json(responseUser); // _id 포함된 객체 반환
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
      members: {
        accepted: [creatorUser._id],  // 생성자는 자동으로 승인됨
        pending: []  // 대기 중인 멤버는 없음
      }
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
  
  // Super Admin 또는 Group Admin이면서 생성자인 경우에만 삭제 허용
  if (user.roles.includes('Super Admin') || (user.roles.includes('Group Admin') && group.creator === user.username)) {
    groups.splice(groupIndex, 1);  // 그룹 삭제
    saveFile(groupsFilePath, groups);  // 변경된 그룹 정보를 저장
    return res.status(200).json({ message: 'Group deleted successfully' });
  } else {
    return res.status(403).json({ error: 'You do not have permission to delete this group.' });
  }
});


// 그룹 조회
app.get('/api/allgroups', (req, res) => {
  res.json(groups); // 모든 그룹을 반환
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

  res.json(group); // members 필드도 반환
});

// 사용자(ID 기반)가 속한 그룹 정보
app.get('/api/users/:id/groups', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userGroups = user.groups || [];
    const acceptedGroups = userGroups.filter(g => g.status === 'Accepted');  // 'Accepted' 상태 필터링

    if (acceptedGroups.length === 0) {
      return res.status(200).json([]);  // Accepted 그룹이 없으면 빈 배열 반환
    }

    // 각 그룹의 ID로 실제 그룹 데이터를 반환
    const groupDetails = acceptedGroups.map(group => {
      const groupInfo = groups.find(g => g.id === group.groupId);
      return {
        groupId: group.groupId,
        name: groupInfo.name,
        description: groupInfo.description,
        status: group.status
      };
    });

    res.status(200).json(groupDetails);  // 그룹 정보 반환
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ error: 'Failed to fetch user groups' });
  }
});

// 사용자가 그룹에 참여하는 API (Pending 상태로 추가)
app.post('/api/groups/:id/join', async (req, res) => {
  const groupId = req.params.id;
  const user = JSON.parse(req.headers.user); // 사용자 정보는 헤더에서 받아옴

  try {
    // 그룹을 찾음
    const group = groups.find(group => group.id === groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // MongoDB에서 사용자 찾기
    const foundUser = await User.findById(user._id);

    if (!foundUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 이미 pending이나 accepted에 존재하는지 확인
    if (group.members.pending.includes(user._id) || group.members.accepted.includes(user._id)) {
      return res.status(400).json({ error: 'User is already a member of the group or pending approval.' });
    }

    // 그룹 멤버 리스트에 사용자 추가 (pending 상태)
    group.members.pending.push(user._id);

    // 사용자의 그룹 목록에 해당 그룹 추가 (상태는 Pending)
    foundUser.groups.push({ groupId: group.id, status: 'Pending' });

    // MongoDB에서 사용자 업데이트
    await foundUser.save();

    // 변경된 그룹 정보를 저장
    saveFile(groupsFilePath, groups);

    res.status(200).json({ message: 'Successfully joined the group. Waiting for approval.' });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'An error occurred while joining the group.' });
  }
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

// 대기 중인 멤버 조회 (Pending 상태)
app.get('/api/groups/:id/members/pending', async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = groups.find(g => g.id === groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // MongoDB에서 해당 그룹의 'Pending' 상태인 유저 찾기
    const pendingMembers = await User.find({
      'groups.groupId': groupId,
      'groups.status': 'Pending'
    }, 'firstName lastName email groups');

    res.status(200).json(pendingMembers);
  } catch (error) {
    console.error('Error loading pending members:', error);
    res.status(500).json({ error: 'Failed to load pending members.' });
  }
});

// 관리자 승인 후 그룹 상태를 'Accepted'로 변경
app.post('/api/groups/:groupId/accept/:userId', async (req, res) => {
  const { groupId, userId } = req.params;

  try {
    // MongoDB에서 유저 찾기
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // group.json에서 그룹 찾기
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 이미 Accepted에 있는지 확인 (중복 방지)
    if (!group.members.accepted.includes(userId)) {
      // accepted에 유저 추가
      group.members.accepted.push(userId);
    }

    // pending에서 유저 제거
    group.members.pending = group.members.pending.filter(id => id !== userId);

    // 사용자의 그룹 상태 변경 (MongoDB)
    const userGroupIndex = user.groups.findIndex(g => g.groupId === groupId);
    if (userGroupIndex !== -1) {
      user.groups[userGroupIndex].status = 'Accepted';
      await user.save();  // MongoDB에 저장
    }

    // group.json 파일 저장
    saveFile(groupsFilePath, groups);

    res.status(200).json({ message: 'Member accepted successfully.' });
  } catch (error) {
    console.error('Error accepting member:', error);
    res.status(500).json({ error: 'Failed to accept member.' });
  }
});

// 유저의 관심 그룹 목록 업데이트 API
app.post('/api/users/:id/updateInterestGroups', async (req, res) => {
  const { id } = req.params;
  const { groupId } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 해당 그룹이 이미 Accepted 상태인지 확인하고, 없으면 추가
    const group = user.groups.find(g => g.groupId === groupId);
    if (group && group.status === 'Accepted') {
      return res.status(400).json({ error: 'Group is already accepted.' });
    } else if (group) {
      group.status = 'Accepted';
    } else {
      user.groups.push({ groupId, status: 'Accepted' });
    }

    await user.save();  // MongoDB에 저장
    res.status(200).json({ message: 'Interest groups updated successfully.' });
  } catch (error) {
    console.error('Error updating interest groups:', error);
    res.status(500).json({ error: 'Failed to update interest groups.' });
  }
});


//그룹 멤버 상태 조회
app.get('/api/groups/:id/members', (req, res) => {
  const group = groups.find(g => g.id === req.params.id);

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  res.json({
    acceptedMembers: group.members.accepted,
    pendingMembers: group.members.pending
  });
});


app.get('/api/groups/:id/members/accepted', async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = groups.find(g => g.id === groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // MongoDB에서 그룹 ID가 일치하고 상태가 Accepted인 멤버들을 조회
    const acceptedMembers = await User.find({
      'groups.groupId': groupId,
      'groups.status': 'Accepted'
    }, 'firstName lastName email groups');

    // 각 멤버의 그룹 정보를 명시적으로 필터링
    const formattedMembers = acceptedMembers.map(member => {
      const memberGroup = member.groups.find(g => g.groupId === groupId);
      return {
        _id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        groupStatus: memberGroup.status  // groupStatus를 명시적으로 추가
      };
    });

    console.log('Accepted members:', formattedMembers);  // 확인용 로그
    res.status(200).json(formattedMembers);  // 명시적으로 구성된 데이터 반환
  } catch (error) {
    console.error('Error loading accepted members:', error);
    res.status(500).json({ error: 'Failed to load accepted members.' });
  }
});


// 그룹에서 유저 삭제 API
app.delete('/api/groups/:groupId/remove/:userId', async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    // 그룹을 JSON 파일에서 찾기
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // MongoDB에서 유저 찾기
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 그룹의 멤버 리스트에서 유저 삭제
    group.members = group.members.filter(memberId => memberId !== userId);

    // 유저의 그룹 목록에서 해당 그룹 삭제
    user.groups = user.groups.filter(groupEntry => groupEntry.groupId !== groupId);

    // 변경된 정보 저장
    saveFile(groupsFilePath, groups); // 그룹 JSON 파일에 저장
    await user.save(); // MongoDB에서 유저 정보 업데이트

    res.status(200).json({ message: 'User removed from group.' });
  } catch (error) {
    console.error('Error removing user from group:', error);
    res.status(500).json({ error: 'Failed to remove user from group.' });
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
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


