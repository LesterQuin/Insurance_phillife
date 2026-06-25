import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import path from 'path';

// 1. Mock dependencies BEFORE importing
jest.unstable_mockModule('../models/financial_Insurance_form.model.js', () => ({}));
jest.unstable_mockModule('../models/requirements/installation_requirements.model.js', () => ({}));
jest.unstable_mockModule('../middlewares/helper.js', () => ({}));

// Mock response helpers
const mockSuccess = jest.fn((res, data, message, statusCode) => res.status(statusCode || 200).json({ status: true, data, message }));
const mockError = jest.fn((res, message, statusCode) => res.status(statusCode || 500).json({ status: false, message }));

jest.unstable_mockModule('../utils/response.js', () => ({
    success: mockSuccess,
    error: mockError
}));

// Mock fs
const mockExistsSync = jest.fn();
const mockStatSync = jest.fn();
jest.unstable_mockModule('fs', () => ({
    default: {
        existsSync: mockExistsSync,
        statSync: mockStatSync
    },
    existsSync: mockExistsSync,
    statSync: mockStatSync
}));

// 2. Import the controller
const { viewRequirementFile } = await import('../controllers/requirements/installation_requirements.controller.js');

describe('viewRequirementFile Controller', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            sendFile: jest.fn(),
            download: jest.fn()
        };
    });

    it('should return 400 if path is missing', async () => {
        await viewRequirementFile(req, res);
        expect(mockError).toHaveBeenCalledWith(res, 'File path query parameter is required.', 400);
    });

    it('should return 403 if path is outside uploads directory (path traversal)', async () => {
        req.query.path = '../package.json';
        await viewRequirementFile(req, res);
        expect(mockError).toHaveBeenCalledWith(res, 'Access Denied: Invalid file path.', 403);
    });

    it('should return 404 if file does not exist', async () => {
        req.query.path = 'uploads/nonexistent.docx';
        mockExistsSync.mockReturnValue(false);

        await viewRequirementFile(req, res);
        expect(mockError).toHaveBeenCalledWith(res, 'File not found on server.', 404);
    });

    it('should return 404 if path is a directory, not a file', async () => {
        req.query.path = 'uploads/requirements';
        mockExistsSync.mockReturnValue(true);
        mockStatSync.mockReturnValue({ isFile: () => false });

        await viewRequirementFile(req, res);
        expect(mockError).toHaveBeenCalledWith(res, 'File not found on server.', 404);
    });

    it('should send file inline if file exists and download is not set', async () => {
        req.query.path = 'uploads/requirements/gpa_uniform_corps/signed_proposal/1780897286269_Basic_Plan.docx';
        mockExistsSync.mockReturnValue(true);
        mockStatSync.mockReturnValue({ isFile: () => true });

        await viewRequirementFile(req, res);

        expect(res.sendFile).toHaveBeenCalled();
        const absolutePath = res.sendFile.mock.calls[0][0];
        expect(absolutePath).toContain('1780897286269_Basic_Plan.docx');
        expect(mockError).not.toHaveBeenCalled();
    });

    it('should trigger download if download parameter is true', async () => {
        req.query.path = 'uploads/requirements/gpa_uniform_corps/signed_proposal/1780897286269_Basic_Plan.docx';
        req.query.download = 'true';
        mockExistsSync.mockReturnValue(true);
        mockStatSync.mockReturnValue({ isFile: () => true });

        await viewRequirementFile(req, res);

        expect(res.download).toHaveBeenCalled();
        const absolutePath = res.download.mock.calls[0][0];
        expect(absolutePath).toContain('1780897286269_Basic_Plan.docx');
        expect(res.download.mock.calls[0][1]).toBe('1780897286269_Basic_Plan.docx');
        expect(mockError).not.toHaveBeenCalled();
    });
});
