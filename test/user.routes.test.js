// import { jest, describe, it, expect, beforeEach } from '@jest/globals';
// import request from 'supertest';
// import express from 'express';

// // Mock the final controller handlers to isolate the test to the routing layer.
// const mockRegisterController = jest.fn((req, res) => res.status(201).json({ message: 'controller called' }));
// const mockUpdateProfileController = jest.fn((req, res) => res.status(200).json({ message: 'update called' }));
// const mockDeactivateAccountController = jest.fn((req, res) => res.status(200).json({ message: 'deactivate called' }));
// const mockActivateAccountController = jest.fn((req, res) => res.status(200).json({ message: 'activate called' }));

// // Mock middleware to just call next(). Their own unit tests are in `validate.test.js`.
// const mockValidateRegister = jest.fn((req, res, next) => next());
// const mockAuthenticate = jest.fn((req, res, next) => next());
// const mockValidateUpdateProfile = jest.fn((req, res, next) => next());

// // Mock the modules BEFORE importing the router that uses them.
// jest.unstable_mockModule('../controllers/user/user_controller.js', () => ({
//     register: mockRegisterController,
//     updateProfile: mockUpdateProfileController,
//     deactivateAccount: mockDeactivateAccountController,
//     activateAccount: mockActivateAccountController,
//     // Mock other controllers used in the router to avoid 'not a function' errors
//     login: jest.fn((req, res) => res.status(200).end()),
//     verifyOTP: jest.fn((req, res) => res.status(200).end()),
//     resendOTP: jest.fn((req, res) => res.status(200).end()),
//     resetPassword: jest.fn((req, res) => res.status(200).end()),
//     logout: jest.fn((req, res) => res.status(200).end()),
//     refreshToken: jest.fn((req, res) => res.status(200).end()),
// }));

// jest.unstable_mockModule('../middlewares/validate.js', () => ({
//     validateRegister: mockValidateRegister,
//     validateUpdateProfile: mockValidateUpdateProfile,
//     // Mock other validators used in the router
//     validateLogin: (req, res, next) => next(),
//     validateVerifyOTP: (req, res, next) => next(),
//     validateResendOTP: (req, res, next) => next(),
//     validateResetPassword: (req, res, next) => next(),
//     validateLogout: (req, res, next) => next(),
//     validateRefreshToken: (req, res, next) => next(),
// }));

// jest.unstable_mockModule('../middlewares/authenticate.js', () => ({
//     authenticate: mockAuthenticate,
// }));

// // Dynamically import the router after mocks are in place.
// const userRouter = (await import('../routes/user/user_route.js')).default;

// // Create a test Express app.
// const app = express();
// app.use(express.json());
// app.use('/api/user', userRouter); // Assuming a base path like /api

// describe('User Routes', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('POST /api/user/register', () => {
//         it('should call validation middleware and the register controller', async () => {
//             const userData = { email: 'john.doe@example.com', password: 'password123' };

//             const response = await request(app)
//                 .post('/api/user/register')
//                 .send(userData);

//             expect(response.status).toBe(201);
//             expect(response.body).toEqual({ message: 'controller called' });
//             expect(mockValidateRegister).toHaveBeenCalledTimes(1);
//             expect(mockRegisterController).toHaveBeenCalledTimes(1);
//         });
//     });

//     describe('PUT /api/user/update-profile', () => {
//         it('should call authentication and validation middleware and the updateProfile controller', async () => {
//             const profileData = { firstname: 'Johnny' };

//             const response = await request(app)
//                 .put('/api/user/update-profile')
//                 .send(profileData);

//             expect(response.status).toBe(200);
//             expect(response.body).toEqual({ message: 'update called' });
//             expect(mockAuthenticate).toHaveBeenCalledTimes(1);
//             expect(mockValidateUpdateProfile).toHaveBeenCalledTimes(1);
//             expect(mockUpdateProfileController).toHaveBeenCalledTimes(1);
//         });
//     });

//     describe('PUT /api/user/deactivate/:userId', () => {
//         it('should call authentication middleware and the deactivateAccount controller', async () => {
//             const response = await request(app)
//                 .put('/api/user/deactivate/1');

//             expect(response.status).toBe(200);
//             expect(response.body).toEqual({ message: 'deactivate called' });
//             expect(mockAuthenticate).toHaveBeenCalledTimes(1);
//             expect(mockDeactivateAccountController).toHaveBeenCalledTimes(1);
//         });
//     });

//     describe('PUT /api/user/activate/:userId', () => {
//         it('should call authentication middleware and the activateAccount controller', async () => {
//             const response = await request(app)
//                 .put('/api/user/activate/1');

//             expect(response.status).toBe(200);
//             expect(response.body).toEqual({ message: 'activate called' });
//             expect(mockAuthenticate).toHaveBeenCalledTimes(1);
//             expect(mockActivateAccountController).toHaveBeenCalledTimes(1);
//         });
//     });
// });
