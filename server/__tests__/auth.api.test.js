const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const User = require('../models/User'); 

// Đặt timeout lớn hơn cho các bài test tương tác DB
jest.setTimeout(30000); 

// Dữ liệu giả định
const mockUser = {
    name: 'Bao Tran',
    email: 'baotran@gmail.com',
    password: '2182004Bao',
};

const invalidPasswordUser = {
    name: 'Invalid User',
    email: 'invalid@jest.com',
    password: 'short',
};

// =========================================================================
// QUẢN LÝ KẾT NỐI DB (FIX LỖI TIMEOUT)
// =========================================================================

beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;
    
    // Kiểm tra và kết nối Mongoose nếu chưa kết nối
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri, {
             useNewUrlParser: true,
             useUnifiedTopology: true,
             serverSelectionTimeoutMS: 5000, 
        });
    }
    // Đảm bảo user mock đã tồn tại cho các test login
    await User.deleteMany({});
    await request(app).post('/api/auth/register').send(mockUser);
});

beforeEach(async () => {
    // Xóa tất cả user ngoại trừ user mock chính
    // Điều này giúp đảm bảo Test 2 (đăng ký user mới) luôn pass
    await User.deleteMany({ email: { $ne: mockUser.email } });
});

afterAll(async () => {
    // Xóa tất cả dữ liệu sau khi chạy xong test
    await User.deleteMany({});
    // Đóng kết nối Mongoose một cách rõ ràng
    await mongoose.connection.close(); 
});


describe('Auth API Endpoints', () => {
    // Test 1: Đăng ký thất bại do validation mật khẩu
    it('should return 400 when registration password fails complexity check', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send(invalidPasswordUser);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/Password must be at least 8 characters long/);
    });

    // Test 2: Đăng ký thành công (Giả định email chưa tồn tại)
    it('should return 201 when registering a new user', async () => {
        const uniqueEmail = `newuser_${Date.now()}@jest.com`;
        const newUser = { ...mockUser, email: uniqueEmail };

        const response = await request(app)
            .post('/api/auth/register')
            .send(newUser);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('role', 'student');
    });

    // Test 3: Đăng nhập thất bại (Sai mật khẩu)
    it('should return 401 on failed login due to wrong password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: mockUser.email, password: 'WrongPassword' });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Invalid email or password');
    });

    // Test 4: Đăng nhập thành công và nhận token
    it('should return 200 and access/refresh tokens on successful login', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send(mockUser);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
    });

    // Test 5: Bảo vệ route (Kiểm tra 401 khi thiếu token)
    it('should return 401 for /profile access when no token is provided', async () => {
        const response = await request(app).get('/api/user/profile');

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Not authorized, no token provided');
    });

    // Test 6: Bảo vệ route (Kiểm tra 200 khi có token hợp lệ)
    it('should return 200 for /profile access when a valid token is provided', async () => {
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send(mockUser);
        
        const token = loginResponse.body.accessToken;

        const profileResponse = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(profileResponse.statusCode).toBe(200);
        expect(profileResponse.body).toHaveProperty('email', mockUser.email);
    });
});