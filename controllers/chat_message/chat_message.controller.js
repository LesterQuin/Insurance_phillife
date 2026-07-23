import * as Model from '../../models/chat_message/chat_message.model.js';
import * as AppModel from '../../models/financial_Insurance_form.model.js';
import { success, error } from '../../utils/response.js';
import sanitizeHtml from 'sanitize-html';
import { sanitizeOptions } from '../../middlewares/helper.js';
import { io } from '../../socket-io/socket_setup.js';
import fs from 'fs';
import path from 'path';

export const getComments = async (req, res) => {
    try {
        const applicationId = parseInt(req.params.applicationId);
        const userId = req.user.user_id;
        const userRole = req.user.role; 

        // Access Control Logic
        const isAdmin = ['superadmin', 'Super Admin'].includes(userRole) || req.user.role_id === 15;
        const isAuthorized = isAdmin || await Model.isUserAuthorizedToView(applicationId, userId);

        if (!isAuthorized) {
            return error(res, 'You are not authorized to view the comments for this application.', 403);
        }

        const comments = await Model.getCommentsByApplicationId(applicationId);
        return success(res, comments, 'Comments fetched successfully.');
    } catch (err) {
        console.error('Get Comments Error:', err);
        return error(res, err.message);
    }
};

export const createComment = async (req, res) => {
    try {
        const applicationId = parseInt(req.params.applicationId);
        let { comment_text } = req.body;
        const userId = req.user.user_id;

        // Verify application exists first to prevent orphan uploads
        const app = await AppModel.getApplicationById(applicationId);
        if (!app) return error(res, 'Application not found.', 404);

        const hasText = comment_text && comment_text.trim();
        const hasFile = req.files && req.files.attachment;

        if (!hasText && !hasFile) {
            return error(res, 'Comment text or file attachment is required.', 400);
        }

        let attachment_path = null;
        let attachment_name = null;

        if (hasFile) {
            const file = req.files.attachment;
            const groupName = app.group_name || 'unassigned_group';
            const sanitizedGroup = groupName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const targetDir = path.join(process.cwd(), 'uploads/comments', sanitizedGroup);

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            attachment_name = file.originalFilename;
            const fileName = `${Date.now()}_${attachment_name.replace(/\s+/g, '_')}`;
            const targetPath = path.join(targetDir, fileName);

            fs.renameSync(file.filepath, targetPath);
            attachment_path = path.join('uploads/comments', sanitizedGroup, fileName).replace(/\\/g, '/');
        }

        if (hasText) {
            comment_text = sanitizeHtml(comment_text, sanitizeOptions);
        } else {
            comment_text = null;
        }

        const newComment = await Model.createComment({
            application_id: applicationId,
            user_id: userId,
            comment_text,
            attachment_path,
            attachment_name
        });

        // Return the single created item to the requester
        const created = await Model.getCommentById(newComment.comment_id);
        io.emit('addNewComment', created);
        return success(res, created, 'Comment added successfully.', 201);
    } catch (err) {
        console.error('Create Comment Error:', err);
        return error(res, err.message);
    }
};

export const updateComment = async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);
        let { comment_text } = req.body;
        const userId = req.user.user_id;

        const existing = await Model.getCommentById(commentId);
        if (!existing) return error(res, 'Comment not found.', 404);

        // Ownership validation
        if (existing.user_id !== userId) {
            return error(res, 'You can only edit your own comments.', 403);
        }

        comment_text = sanitizeHtml(comment_text, sanitizeOptions);
        const updated = await Model.updateComment(commentId, comment_text);
        io.emit('updateComment', updated);

        return success(res, updated, 'Comment updated successfully.');
    } catch (err) {
        console.error('Update Comment Error:', err);
        return error(res, err.message);
    }
};


export const deleteComment = async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);
        const userId = req.user.user_id;
        const userRole = req.user.role;

        const existing = await Model.getCommentById(commentId);
        if (!existing) return error(res, 'Comment not found.', 404);

        // Authorization: Users can only delete their own comments. 
        // Admins (superadmin, or Role ID 15) can delete any comment.
        const isAdmin = ['super admin', 'Super Admin'].includes(userRole) || req.user.role_id === 15;

        if (existing.user_id !== userId && !isAdmin) {
            return error(res, 'You are not authorized to delete this comment.', 403);
        }

        const isDeleted = await Model.deleteComment(commentId);
        io.emit('deletedComment', { comment_id: commentId, is_deleted: isDeleted });

        return success(res, { 
            is_deleted: isDeleted,
            deleted_at: isDeleted ? new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : null
        }, isDeleted ? 'Comment deleted successfully.' : 'Comment could not be deleted.');
    } catch (err) {
        console.error('Delete Comment Error:', err);
        return error(res, err.message);
    }
};

export const viewAttachment = async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);
        const userId = req.user.user_id;
        const userRole = req.user.role;

        const comment = await Model.getCommentById(commentId);
        if (!comment) {
            return error(res, 'Comment not found.', 404);
        }

        if (!comment.attachment_path) {
            return error(res, 'This comment does not have an attachment.', 404);
        }

        // Access Control Logic
        const isAdmin = ['superadmin', 'Super Admin'].includes(userRole) || req.user.role_id === 15;
        const isAuthorized = isAdmin || await Model.isUserAuthorizedToView(comment.application_id, userId);

        if (!isAuthorized) {
            return error(res, 'You are not authorized to access this attachment.', 403);
        }

        const absolutePath = path.resolve(process.cwd(), comment.attachment_path);
        const uploadsDir = path.resolve(process.cwd(), 'uploads');

        // Security check: Prevent path traversal (must be inside uploads directory)
        const relative = path.relative(uploadsDir, absolutePath);
        const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

        if (!isSafe) {
            return error(res, 'Access Denied: Invalid file path.', 403);
        }

        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
            return error(res, 'File not found on server.', 404);
        }

        // Support forcing download via query param ?download=true
        if (req.query.download === 'true') {
            return res.download(absolutePath, comment.attachment_name || path.basename(absolutePath));
        }

        return res.sendFile(absolutePath);
    } catch (err) {
        console.error('View attachment error:', err);
        return error(res, err.message, 500);
    }
};
