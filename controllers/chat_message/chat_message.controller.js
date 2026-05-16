import * as Model from '../../models/chat_message/chat_message.model.js';
import * as AppModel from '../../models/financial_Insurance_form.model.js';
import { success, error } from '../../utils/response.js';
import sanitizeHtml from 'sanitize-html';
import { broadcastComment } from '../../websocket.js';
import { sanitizeOptions } from '../../middlewares/helper.js';

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

        if (!comment_text) return error(res, 'Comment text cannot be empty.', 400);

        // Verify application exists
        const app = await AppModel.getApplicationById(applicationId);
        if (!app) return error(res, 'Application not found.', 404);

        comment_text = sanitizeHtml(comment_text, sanitizeOptions);

        const newComment = await Model.createComment({
            application_id: applicationId,
            user_id: userId,
            comment_text
        });

        // Retrieve full comment details (including name) for immediate UI update
        const created = await Model.getCommentById(newComment.comment_id);

        // Broadcast the new comment to all subscribed clients
        broadcastComment(applicationId, created);

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
        return success(res, { 
            is_deleted: isDeleted,
            deleted_at: isDeleted ? new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : null
        }, isDeleted ? 'Comment deleted successfully.' : 'Comment could not be deleted.');
    } catch (err) {
        console.error('Delete Comment Error:', err);
        return error(res, err.message);
    }
};
