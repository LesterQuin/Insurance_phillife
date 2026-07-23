import express from 'express';
import * as Controller from '../../controllers/chat_message/chat_message.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import parseMultipartForm from '../../middlewares/fileUpload.js';

const router = express.Router();

// Get comments thread for an application
router.get('/applications/:applicationId/comments', authenticate, Controller.getComments);

// Post a new comment to an application
router.post('/applications/:applicationId/comments', authenticate, parseMultipartForm, Controller.createComment);

// Update a comment
router.put('/comments/:commentId', authenticate, Controller.updateComment);

// Delete a comment
router.delete('/comments/:commentId', authenticate, Controller.deleteComment);

// Download or view a comment attachment
router.get('/comments/:commentId/attachment', authenticate, Controller.viewAttachment);
// /api/chat-messages/comments/123/attachment?download=true

export default router;
