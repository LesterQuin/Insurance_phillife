// import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// // 1. Mock dependencies BEFORE importing the controller

// // Mock the user model
// jest.unstable_mockModule('../models/user/user_model.js', () => ({
//     getUserByEmail: jest.fn(),
//     createUser: jest.fn(),
//     getUserById: jest.fn(),
//     setUserStatus: jest.fn(),
// }));

// // Mock nodemailer to prevent actual email sending
// jest.unstable_mockModule('nodemailer', () => ({
//     createTransport: jest.fn().mockReturnValue({
//         sendMail: jest.fn().mockResolvedValue(true),
//     }),
// }));

// // 2. Dynamically import the controller and mocked dependencies
// const UserController = await import('../controllers/user/user_controller.js');
// const UserModel = await import('../models/user/user_model.js');
// const nodemailer = await import('nodemailer');

// describe('User Controller - register', () => {
//     let req, res, next;

//     beforeEach(() => {
//         jest.clearAllMocks();
//         req = {
//             body: {
//                 firstname: 'John',
//                 lastname: 'Doe',
//                 email: 'john.doe@example.com',
//                 role_id: 2,
//             },
//         };
//         res = {
//             status: jest.fn().mockReturnThis(),
//             json: jest.fn(),
//         };
//         // The controller uses try/catch, so we don't need to mock `next`
//     });

//     it('should register a new user successfully', async () => {
//         // Arrange: Mock functions to simulate a successful registration path.
//         UserModel.getUserByEmail.mockResolvedValue(null); // User does not exist
//         UserModel.createUser.mockResolvedValue({ userId: 1, tempPassword: 'abc' }); // Mock created user
//         const transporter = nodemailer.createTransport();

//         // Act: Call the controller function.
//         await UserController.register(req, res);

//         // Assert: Verify that the correct functions were called with the correct arguments.
//         expect(UserModel.getUserByEmail).toHaveBeenCalledWith('john.doe@example.com');
//         expect(UserModel.createUser).toHaveBeenCalled();
//         expect(transporter.sendMail).toHaveBeenCalled();
//         expect(res.status).toHaveBeenCalledWith(201);
//         expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//             status: true,
//             message: 'User registered, temporary password sent via email'
//         }));
//     });

//     it('should return 400 if user already exists', async () => {
//         // Arrange: Mock getUserByEmail to return an existing user.
//         UserModel.getUserByEmail.mockResolvedValue({ id: 1, email: 'john.doe@example.com' });

//         // Act
//         await UserController.register(req, res);

//         // Assert
//         expect(UserModel.createUser).not.toHaveBeenCalled();
//         expect(res.status).toHaveBeenCalledWith(400);
//         expect(res.json).toHaveBeenCalledWith({
//             status: false,
//             message: 'Email already registered.'
//         });
//     });

//     it('should return 500 on a database error', async () => {
//         // Arrange
//         const dbError = new Error('Database connection failed');
//         UserModel.getUserByEmail.mockRejectedValue(dbError);

//         // Act
//         await UserController.register(req, res);

//         // Assert that the controller's catch block handled it
//         expect(res.status).toHaveBeenCalledWith(500);
//         expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//             status: false,
//             message: 'Server error'
//         }));
//     });
// });

// describe('User Controller - deactivateAccount', () => {
//     let req, res;

//     beforeEach(() => {
//         jest.clearAllMocks();
//         req = {
//             params: {
//                 userId: 1
//             },
//         };
//         res = {
//             status: jest.fn().mockReturnThis(),
//             json: jest.fn(),
//         };
//     });

//     it('should deactivate a user account successfully', async () => {
//         // Arrange
//         UserModel.getUserById.mockResolvedValue({ user_id: 1, email: 'john.doe@example.com' });
//         UserModel.setUserStatus.mockResolvedValue(true);

//         // Act
//         await UserController.deactivateAccount(req, res);

//         // Assert
//         expect(UserModel.getUserById).toHaveBeenCalledWith(1);
//         expect(UserModel.setUserStatus).toHaveBeenCalledWith(1, 0);
//         expect(res.status).toHaveBeenCalledWith(200);
//         expect(res.json).toHaveBeenCalledWith({
//             status: true,
//             message: 'User account has been successfully deactivated.'
//         });
//     });

//     it('should return 404 if user not found', async () => {
//         // Arrange
//         UserModel.getUserById.mockResolvedValue(null);

//         // Act
//         await UserController.deactivateAccount(req, res);

//         // Assert
//         expect(UserModel.getUserById).toHaveBeenCalledWith(1);
//         expect(UserModel.setUserStatus).not.toHaveBeenCalled();
//         expect(res.status).toHaveBeenCalledWith(404);
//         expect(res.json).toHaveBeenCalledWith({
//             status: false,
//             message: 'User not found.'
//         });
//     });

//     it('should return 500 on a database error', async () => {
//         // Arrange
//         const dbError = new Error('Database connection failed');
//         UserModel.getUserById.mockRejectedValue(dbError);

//         // Act
//         await UserController.deactivateAccount(req, res);

//         // Assert
//         expect(res.status).toHaveBeenCalledWith(500);
//         expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//             status: false,
//             message: 'Server error'
//         }));
//     });
// });

// describe('User Controller - activateAccount', () => {
//     let req, res;

//     beforeEach(() => {
//         jest.clearAllMocks();
//         req = {
//             params: {
//                 userId: 1
//             },
//         };
//         res = {
//             status: jest.fn().mockReturnThis(),
//             json: jest.fn(),
//         };
//     });

//     it('should activate a user account successfully', async () => {
//         // Arrange
//         UserModel.getUserById.mockResolvedValue({ user_id: 1, email: 'john.doe@example.com' });
//         UserModel.setUserStatus.mockResolvedValue(true);

//         // Act
//         await UserController.activateAccount(req, res);

//         // Assert
//         expect(UserModel.getUserById).toHaveBeenCalledWith(1);
//         expect(UserModel.setUserStatus).toHaveBeenCalledWith(1, 1);
//         expect(res.status).toHaveBeenCalledWith(200);
//         expect(res.json).toHaveBeenCalledWith({
//             status: true,
//             message: 'User account has been successfully activated.'
//         });
//     });

//     it('should return 404 if user not found', async () => {
//         // Arrange
//         UserModel.getUserById.mockResolvedValue(null);

//         // Act
//         await UserController.activateAccount(req, res);

//         // Assert
//         expect(UserModel.getUserById).toHaveBeenCalledWith(1);
//         expect(UserModel.setUserStatus).not.toHaveBeenCalled();
//         expect(res.status).toHaveBeenCalledWith(404);
//         expect(res.json).toHaveBeenCalledWith({
//             status: false,
//             message: 'User not found.'
//         });
//     });

//     it('should return 500 on a database error', async () => {
//         // Arrange
//         const dbError = new Error('Database connection failed');
//         UserModel.getUserById.mockRejectedValue(dbError);

//         // Act
//         await UserController.activateAccount(req, res);

//         // Assert
//         expect(res.status).toHaveBeenCalledWith(500);
//         expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//             status: false,
//             message: 'Server error'
//         }));
//     });
// });
