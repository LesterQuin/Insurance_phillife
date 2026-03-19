// import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// // 1. Mock the models BEFORE importing the middleware.
// // This prevents the real models (and the DB connection) from loading.
// jest.unstable_mockModule('../models/user/user_model.js', () => ({
//     getLookupListByCategory: jest.fn(),
// }));

// jest.unstable_mockModule('../models/financial_Insurance_form.model.js', () => ({
//     getLookupListByCategory: jest.fn(),
//     getAllPlans: jest.fn(),
//     getBasicPlansByPlanId: jest.fn(),
//     getRidersByBasicPlanId: jest.fn(),
//     getApplicationById: jest.fn(),
//     getLookupNamesByIds: jest.fn(),
// }));

// // 2. Dynamically import the modules under test and the mocked dependencies
// const { validateRegister, validateLogin, validateFinancialApplication, validateUpdateFinancialApplication } = await import('../middlewares/validate.js');
// const User = await import('../models/user/user_model.js');
// const Financial = await import('../models/financial_Insurance_form.model.js');

// // Helper function to run the middleware chain
// const runValidation = async (middlewares, reqBody, reqParams = {}) => {
//     const req = {
//         body: reqBody,
//         headers: {},
//         params: reqParams,
//         lookupCache: {} // Simulate the cache object attached during validation
//     };
//     const res = {
//         status: jest.fn().mockReturnThis(),
//         json: jest.fn(),
//     };
//     const next = jest.fn();

//     for (const middleware of middlewares) {
//         await middleware(req, res, next);
//         // If a middleware responded (e.g., returned 400), stop the chain
//         if (res.status.mock.calls.length > 0) break;
//     }

//     return { req, res, next };
// };

// describe('Validation Middleware Tests', () => {
    
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     // -------------------------------------------------------------------------
//     // 1. User Login Validation
//     // -------------------------------------------------------------------------
//     describe('validateLogin', () => {
//         it('should pass with valid credentials', async () => {
//             const { res, next } = await runValidation(validateLogin, {
//                 email: 'test@gmail.com',
//                 password: 'password123'
//             });

//             expect(res.status).not.toHaveBeenCalled();
//             expect(next).toHaveBeenCalled();
//         });

//         it('should fail when email is invalid', async () => {
//             const { res } = await runValidation(validateLogin, {
//                 email: 'invalid-email',
//                 password: 'password123'
//             });

//             expect(res.status).toHaveBeenCalledWith(400);
//             expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//                 status: false,
//                 errors: expect.arrayContaining([
//                     expect.objectContaining({ msg: 'Invalid email format' })
//                 ])
//             }));
//         });
//     });

//     // -------------------------------------------------------------------------
//     // 2. User Registration Validation
//     // -------------------------------------------------------------------------
//     describe('validateRegister', () => {
//         beforeEach(() => {
//             // Mock User model lookups
//             User.getLookupListByCategory.mockImplementation(async (category) => {
//                 if (category === 'ROLE') return [{ id: 1, name: 'Admin' }, { id: 2, name: 'User' }];
//                 if (category === 'DEPARTMENT') return [{ id: 10, name: 'IT' }];
//                 if (category === 'LOCATION') return [{ id: 100, name: 'HQ' }];
//                 return [];
//             });
//         });

//         it('should pass with valid registration data', async () => {
//             const { res, next } = await runValidation(validateRegister, {
//                 firstname: 'John',
//                 lastname: 'Doe',
//                 email: 'john@gmail.com',
//                 role_id: 1,
//                 department_id: 10,
//                 location_id: 100
//             });

//             expect(res.status).not.toHaveBeenCalled();
//             expect(next).toHaveBeenCalled();
//         });

//         it('should fail if role_id is invalid (custom validator)', async () => {
//             const { res } = await runValidation(validateRegister, {
//                 firstname: 'John',
//                 lastname: 'Doe',
//                 email: 'john@gmail.com',
//                 role_id: 999, // Invalid ID
//             });

//             expect(res.status).toHaveBeenCalledWith(400);
//             expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//                 errors: expect.arrayContaining([
//                     expect.objectContaining({ msg: expect.stringContaining('Invalid role_id') })
//                 ])
//             }));
//         });
//     });

//     // -------------------------------------------------------------------------
//     // 3. Financial Application Validation
//     // -------------------------------------------------------------------------
//     describe('validateFinancialApplication', () => {
//         beforeEach(() => {
//             // Mock Financial model lookups
//             Financial.getLookupListByCategory.mockImplementation(async (category) => {
//                 if (category === 'GROUP_CLASSIFICATION') return [{ id: 1, name: 'Private' }, { id: 5, name: 'Others' }];
//                 if (category === 'BUSINESS_TYPE') return [{ id: 1, name: 'IT' }];
//                 if (category === 'TYPE_OF_GROUP') return [{ id: 1, name: 'Regular', parent_id: null }, { id: 2, name: 'SubGroup', parent_id: 1 }];
//                 if (category === 'MODE_OF_PAYMENT') return [{ id: 1, name: 'Annual' }];
//                 return [];
//             });

//             Financial.getAllPlans.mockResolvedValue([{ plan_id: 1, proposal_plan: 'Plan A' }]);
//             Financial.getBasicPlansByPlanId.mockResolvedValue([{ basic_plan_id: 1, basic_plan_name: 'Basic A' }]);
//             Financial.getRidersByBasicPlanId.mockResolvedValue([{ rider_id: 1, rider_name: 'Rider A' }]);
//         });

//         const validAppData = {
//             group_name: 'Acme Corp',
//             business_nature: 'Tech',
//             number_of_lives: 10,
//             business_address: '123 St',
//             contact_number: '1234567890',
//             fax_number: '123456',
//             email: 'contact@acme.com',
//             contact_person: 'Jane Doe',
//             designation: 'CEO',
//             proposal_addressee: 'John Doe',
//             addressee_designation: 'Manager',
//             group_classification_id: 1, // Private
//             business_type_id: 1,
//             group_type_id: 1,
//             payment_mode_id: 1,
//             plan_id: 1,
//             basic_plan_id: 1,
//             rider_ids: [1]
//         };

//         it('should pass with valid application data', async () => {
//             const { res, next } = await runValidation(validateFinancialApplication, validAppData);

//             expect(res.status).not.toHaveBeenCalled();
//             expect(next).toHaveBeenCalled();
//         });

//         it('should fail if plan_id is invalid', async () => {
//             const { res } = await runValidation(validateFinancialApplication, {
//                 ...validAppData,
//                 plan_id: 999
//             });

//             expect(res.status).toHaveBeenCalledWith(400);
//             expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//                 errors: expect.arrayContaining([
//                     expect.objectContaining({ msg: expect.stringContaining('Invalid plan_id') })
//                 ])
//             }));
//         });

//         // Test "Other" field logic
//         it('should require "other_group_classification" text if "Others" is selected', async () => {
//             const { res } = await runValidation(validateFinancialApplication, {
//                 ...validAppData,
//                 group_classification_id: 5, // Others
//                 other_group_classification: '' // Empty
//             });

//             expect(res.status).toHaveBeenCalledWith(400);
//             expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//                 errors: expect.arrayContaining([
//                     expect.objectContaining({ msg: 'other_group_classification is required when "Others" is selected.' })
//                 ])
//             }));
//         });

//         it('should forbid "other_group_classification" text if "Others" is NOT selected', async () => {
//             const { res } = await runValidation(validateFinancialApplication, {
//                 ...validAppData,
//                 group_classification_id: 1, // Private
//                 other_group_classification: 'Some text' // Should be empty
//             });

//             expect(res.status).toHaveBeenCalledWith(400);
//             expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//                 errors: expect.arrayContaining([
//                     expect.objectContaining({ msg: 'other_group_classification must be empty when Group Classification is not "Others".' })
//                 ])
//             }));
//         });

//         // Test Dependent Field Logic
//         it('should fail if sub_group_type_id does not belong to group_type_id', async () => {
//             // Mock lookup to return a subgroup that has a different parent
//             Financial.getLookupListByCategory.mockImplementation(async (category) => {
//                 if (category === 'TYPE_OF_GROUP') return [
//                     { id: 1, name: 'Regular', parent_id: null },
//                     { id: 3, name: 'Alien Subgroup', parent_id: 99 } // Parent is 99, not 1
//                 ];
//                 return [];
//             });

//             const { res } = await runValidation(validateFinancialApplication, {
//                 ...validAppData,
//                 group_type_id: 1,
//                 sub_group_type_id: 3
//             });

//             expect(res.status).toHaveBeenCalledWith(400);
//         });
//     });

//     // -------------------------------------------------------------------------
//     // 4. Financial Application Update Validation
//     // -------------------------------------------------------------------------
//     describe('validateUpdateFinancialApplication', () => {
//         const existingApp = {
//             application_id: 1,
//             group_name: 'Old Corp',
//             group_type: { id: 1, name: 'Regular' },
//             plan: { id: 1, name: 'Plan A' },
//             basic_plan: { id: 1, name: 'Basic A' },
//         };

//         beforeEach(() => {
//             // Mock the pre-fetch middleware's DB call
//             Financial.getApplicationById.mockResolvedValue(existingApp);
//             // Mock other lookups as needed for custom validators
//             Financial.getLookupListByCategory.mockImplementation(async (category) => {
//                 if (category === 'TYPE_OF_GROUP') return [
//                     { id: 1, name: 'Regular', parent_id: null },
//                     { id: 2, name: 'SubGroup', parent_id: 1 }
//                 ];
//                 return [];
//             });
//         });

//         it('should pass with a valid partial update', async () => {
//             const { res, next } = await runValidation(
//                 validateUpdateFinancialApplication,
//                 { number_of_lives: 150 }, // Only updating one field
//                 { id: 1 } // Providing req.params.id
//             );

//             expect(Financial.getApplicationById).toHaveBeenCalledWith(1);
//             expect(res.status).not.toHaveBeenCalled();
//             expect(next).toHaveBeenCalled();
//         });

//         it('should fail if an invalid value is provided in the partial update', async () => {
//             const { res } = await runValidation(
//                 validateUpdateFinancialApplication,
//                 { email: 'not-an-email' },
//                 { id: 1 }
//             );

//             expect(res.status).toHaveBeenCalledWith(400);
//             expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//                 errors: expect.arrayContaining([
//                     expect.objectContaining({ msg: 'Valid Email is required' })
//                 ])
//             }));
//         });

//         it('should correctly validate a dependent field using existing data from pre-fetch', async () => {
//             // Here we update sub_group_type_id. The validator needs group_type_id.
//             // It's not in the body, so it should be read from req.existingApplication.
//             const { res, next } = await runValidation(
//                 validateUpdateFinancialApplication,
//                 { sub_group_type_id: 2 }, // A valid subgroup for group_type_id 1
//                 { id: 1 }
//             );

//             expect(res.status).not.toHaveBeenCalled();
//             expect(next).toHaveBeenCalled();
//         });

//         it('should fail if the application ID for the update does not exist', async () => {
//             Financial.getApplicationById.mockResolvedValue(null); // Mock "not found"

//             const { res } = await runValidation(validateUpdateFinancialApplication, { number_of_lives: 150 }, { id: 999 });

//             expect(res.status).toHaveBeenCalledWith(404);
//         });
//     });
// });