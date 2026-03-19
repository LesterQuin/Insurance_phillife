// import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
// import supertest from 'supertest';
// import express from 'express';
// import bodyParser from 'body-parser';
// import cookieParser from 'cookie-parser';

// // 1️⃣ Mock dependencies BEFORE importing modules that use them

// // Mock Nodemailer - controller uses "import * as nodemailer from 'nodemailer'"
// jest.unstable_mockModule('nodemailer', () => ({
//   __esModule: true,
//   default: {
//     createTransport: jest.fn(() => ({
//       sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
//     })),
//   },
//   createTransport: jest.fn(() => ({
//     sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
//   })),
// }));

// // Mock bcrypt
// jest.unstable_mockModule('bcryptjs', () => ({
//   __esModule: true,
//   default: {
//     compare: jest.fn().mockResolvedValue(true),
//     hash: jest.fn().mockResolvedValue('hashed_password'),
//   },
// }));

// // Mock JWT
// jest.unstable_mockModule('jsonwebtoken', () => ({
//   __esModule: true,
//   default: {
//     sign: jest.fn((payload) => `mocked-token-for-${payload.userId}`),
//     verify: jest.fn(() => ({ userId: 1, email: 'test@user.com', role_id: 2 })),
//   },
// }));

// // Mock user model - Note: getLookupListByCategory is needed by validate middlewares
// jest.unstable_mockModule('../models/user/user_model.js', () => ({
//   __esModule: true,
//   createUser: jest.fn(),
//   getUserByEmail: jest.fn(),
//   saveOTP: jest.fn(),
//   verifyOTP: jest.fn(),
//   clearOTP: jest.fn(),
//   updatePassword: jest.fn(),
//   getUserById: jest.fn(),
//   updateProfile: jest.fn(),
//   saveTokens: jest.fn(),
//   clearTokens: jest.fn(),
//   getLookupListByCategory: jest.fn(async (category) => {
//     if (category === 'ROLE') return [{ id: 1, name: 'Admin' }, { id: 2, name: 'User' }];
//     if (category === 'DEPARTMENT') return [{ id: 10, name: 'IT' }];
//     if (category === 'LOCATION') return [{ id: 100, name: 'HQ' }];
//     return [];
//   }),
// }));

// // Mock authenticate middleware
// jest.unstable_mockModule('../middlewares/authenticate.js', () => ({
//   __esModule: true,
//   default: {
//     authenticate: jest.fn((req, res, next) => {
//       // Check for token in header
//       const token = req.headers.authorization?.split(' ')[1];
//       if (!token) {
//         return res.status(401).json({ status: false, message: 'Access token missing' });
//       }
//       // Mock sets user on request
//       req.user = { userId: 1, email: 'test@user.com' };
//       return next();
//     }),
//   },
//   authenticate: jest.fn((req, res, next) => {
//     // Check for token in header
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ status: false, message: 'Access token missing' });
//     }
//     // Mock sets user on request
//     req.user = { userId: 1, email: 'test@user.com' };
//     return next();
//   }),
// }));

// // Mock validate middlewares - they call getLookupListByCategory
// jest.unstable_mockModule('../middlewares/validate.js', () => ({
//   __esModule: true,
//   validateRegister: [
//     jest.fn((req, res, next) => next()), // Pass through for testing
//   ],
//   validateLogin: [
//     jest.fn((req, res, next) => next()),
//   ],
//   validateVerifyOTP: [
//     jest.fn((req, res, next) => next()),
//   ],
//   validateResendOTP: [
//     jest.fn((req, res, next) => next()),
//   ],
//   validateResetPassword: [
//     jest.fn((req, res, next) => next()),
//   ],
//   validateLogout: [
//     jest.fn((req, res, next) => next()),
//   ],
//   validateRefreshToken: [
//     jest.fn((req, res, next) => next()),
//   ],
//   validateUpdateProfile: [
//     jest.fn((req, res, next) => next()), // Pass through for testing
//   ],
// }));

// // 2️⃣ Import modules under test
// const userRouter = (await import('../routes/user/user_route.js')).default;
// const User = await import('../models/user/user_model.js');
// const { authenticate } = await import('../middlewares/authenticate.js');

// // 3️⃣ Setup Express app
// const app = express();
// app.use(bodyParser.json());
// app.use(cookieParser());
// app.use('/user', userRouter);
// const request = supertest(app);

// // 4️⃣ Suppress console.log during tests
// beforeAll(() => {
//   jest.spyOn(console, 'log').mockImplementation(() => {});
//   jest.spyOn(console, 'error').mockImplementation(() => {});
// });
// afterAll(() => {
//   console.log.mockRestore();
//   console.error.mockRestore();
// });

// describe('User API Routes', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   // --- POST /user/register ---
//   describe('POST /user/register', () => {
//     const validRegisterData = {
//       firstname: 'John',
//       lastname: 'Doe',
//       email: 'john.doe@gmail.com', // Use a valid domain to pass validation
//       role_id: 2,
//       department_id: 10,
//       location_id: 100,
//       phoneNumber: '1234567890',
//     };

//     it('should register a new user and return 201', async () => {
//       User.getUserByEmail.mockResolvedValue(null);
//       User.createUser.mockResolvedValue({
//         userId: 1,
//         ...validRegisterData,
//         tempPassword: 'temp-pass-123',
//       });

//       const res = await request.post('/user/register').send(validRegisterData);

//       expect(res.status).toBe(201);
//       expect(res.body.status).toBe(true);
//       expect(res.body.message).toContain('User registered');
//       expect(User.getUserByEmail).toHaveBeenCalledWith(validRegisterData.email);
//       expect(User.createUser).toHaveBeenCalled();
//     });

//     it('should return 400 if email already exists', async () => {
//       // Use a valid email format for the check
//       User.getUserByEmail.mockResolvedValue({ user_id: 2, email: 'jane.doe@gmail.com' });

//       const res = await request.post('/user/register').send({
//         ...validRegisterData,
//         email: 'jane.doe@gmail.com'
//       });

//       expect(res.status).toBe(400);
//       expect(res.body.status).toBe(false);
//       expect(res.body.message).toBe('Email already registered.');
//       expect(User.createUser).not.toHaveBeenCalled();
//     });
//   });

//   // --- PUT /user/update-profile ---
//   describe('PUT /user/update-profile', () => {
//     const updateData = {
//       firstname: 'Johnathan',
//       lastname: 'Doering',
//       phoneNumber: '1234567890',
//       suffix: 'Jr.',
//     };

//     it('should update profile and return 200', async () => {
//       // Mock user fetch
//       User.getUserById.mockResolvedValue({
//         user_id: 1,
//         firstname: 'John',
//         lastname: 'Doe',
//         password_hash: 'hashed_pw',
//       });
//       // Mock profile update
//       User.updateProfile.mockResolvedValue({ user_id: 1, ...updateData });

//       // Make request with Authorization header
//       const res = await request
//         .put('/user/update-profile')
//         .set('Authorization', 'Bearer mock-token')
//         .send(updateData);

//       expect(res.status).toBe(200);
//       expect(res.body.status).toBe(true);
//       expect(res.body.message).toBe('Profile updated successfully');
//       expect(User.getUserById).toHaveBeenCalledWith(1);
//       expect(User.updateProfile).toHaveBeenCalled();
//     });

//     it('should return 401 if authentication fails (no token)', async () => {
//       const res = await request.put('/user/update-profile').send(updateData);

//       expect(res.status).toBe(401);
//       expect(res.body.message).toBe('Access token missing');
//     });
//   });
// });

