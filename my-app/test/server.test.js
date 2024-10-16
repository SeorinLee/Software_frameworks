const request = require('supertest');
const http = require('http');
const express = require('express');
const app = require('../server'); // 서버 파일을 불러옵니다.
const chai = require('chai');
const expect = chai.expect;

describe('API Tests', () => {
  let server;

  before((done) => {
    server = http.createServer(app); // 서버를 생성합니다.
    server.listen(4002, done); // 포트 4002에서 서버를 실행합니다.
  });

  after((done) => {
    server.close(done); // 테스트가 끝나면 서버를 종료합니다.
  });

  it('GET / - 서버 상태 확인', (done) => {
    request(server)
      .get('/')
      .expect(200, 'Server is running!', done); // 응답이 200인지 확인합니다.
  });

  it('GET /api/channels/:channelId/messages - 메시지 가져오기', (done) => {
    const testChannelId = 'testChannelId'; // 테스트에 사용할 채널 ID입니다.
    
    request(server)
      .get(`/api/channels/${testChannelId}/messages`)
      .expect(200) // 성공적으로 요청해야 합니다.
      .end((err, res) => {
        expect(res.body).to.be.an('array'); // 응답이 배열인지 확인합니다.
        done();
      });
  });

  it('POST /api/register - 사용자 등록', (done) => {
    const newUser = {
      username: 'testUser',
      password: 'testPassword',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      dob: '1990-01-01'
    };

    request(server)
      .post('/api/register')
      .send(newUser)
      .expect(201) // 성공적으로 생성되어야 합니다.
      .end((err, res) => {
        expect(res.body).to.have.property('success', true); // 성공 메시지를 확인합니다.
        done();
      });
  });

  it('GET /api/users/:id - 사용자 정보 조회', (done) => {
    const testUserId = 'testUserId'; // 테스트에 사용할 사용자 ID입니다.
    
    request(server)
      .get(`/api/users/${testUserId}`)
      .expect(200) // 성공적으로 요청해야 합니다.
      .end((err, res) => {
        expect(res.body).to.have.property('username'); // 응답에 username이 포함되어야 합니다.
        done();
      });
  });
});
