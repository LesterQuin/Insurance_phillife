// import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// // 1. Mock dependencies

// // Mock the mssql request chain
// const mockRequest = {
//     input: jest.fn().mockReturnThis(),
//     query: jest.fn(),
// };
// const mockPool = {
//     request: jest.fn(() => mockRequest),
// };

// // Mock the DB config
// jest.unstable_mockModule('../config/db.js', () => ({
//     poolPromise: Promise.resolve(mockPool),
//     // Mock sql object to avoid errors
//     sql: {
//         VarChar: 'mock.VarChar',
//         Int: 'mock.Int',
//         Bit: 'mock.Bit',
//     }
// }));

// // Mock bcrypt since it's slow and an external dependency.
// // The model uses bcryptjs
// jest.unstable_mockModule('bcryptjs', () => ({
//     hash: jest.fn().mockResolvedValue('hashed-temp-password'),
// }));

// // 2. Dynamically import modules under test
// const UserModel = await import('../models/user/user_model.js');
// const bcrypt = await import('bcryptjs');

// describe('User Model - createUser', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     it('should hash a temporary password and insert a new user', async () => {
//         // Arrange
//         const userData = {
//             firstname: 'Test',
//             lastname: 'User',
//             email: 'test@user.com',
//             role_id: 2,
//         };

//         // Mock the DB response
//         mockRequest.query.mockResolvedValue({ recordset: [{ userId: 123 }] });

//         // Act
//         const newUser = await UserModel.createUser(userData);

//         // Assert
//         // 1. Check if a password was hashed
//         expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);

//         // 2. Check if the correct inputs were passed to the DB request
//         expect(mockRequest.input).toHaveBeenCalledWith('firstname', expect.any(String), userData.firstname);
//         expect(mockRequest.input).toHaveBeenCalledWith('password_hash', expect.any(String), 'hashed-temp-password');
//         expect(mockRequest.input).toHaveBeenCalledWith('is_active', expect.any(String), 1); // User is active upon registration
//         expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO DHUB.sg.financial_insurance_users'));

//         // 3. Check if the function returns the correct data
//         expect(newUser).toBeDefined();
//         expect(newUser.userId).toBe(123);
//         expect(newUser.tempPassword).toBeDefined();
//     });
// });

// describe('User Model - setUserStatus', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     it('should set user status to active (is_active = 1)', async () => {
//         // Arrange
//         const userId = 1;
//         const isActive = 1;

//         mockRequest.query.mockResolvedValue({ recordset: [] });

//         // Act
//         await UserModel.setUserStatus(userId, isActive);

//         // Assert
//         expect(mockPool.request).toHaveBeenCalled();
//         expect(mockRequest.input).toHaveBeenCalledWith('userId', expect.any(String), userId);
//         expect(mockRequest.input).toHaveBeenCalledWith('isActive', expect.any(String), isActive);
//         expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE DHUB.sg.financial_insurance_users'));
//     });

//     it('should set user status to inactive (is_active = 0) and clear tokens', async () => {
//         // Arrange
//         const userId = 1;
//         const isActive = 0;

//         mockRequest.query.mockResolvedValue({ recordset: [] });

//         // Act
//         await UserModel.setUserStatus(userId, isActive);

//         // Assert
//         expect(mockPool.request).toHaveBeenCalled();
//         expect(mockRequest.input).toHaveBeenCalledWith('userId', expect.any(String), userId);
//         expect(mockRequest.input).toHaveBeenCalledWith('isActive', expect.any(String), isActive);
//         expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE DHUB.sg.financial_insurance_users'));
//     });
// });
