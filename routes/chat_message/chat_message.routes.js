import express from 'express';
import * as Controller from '../../controllers/chat_message/chat_message.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = express.Router();

// Get comments thread for an application
router.get('/applications/:applicationId/comments', authenticate, Controller.getComments);

// Post a new comment to an application
router.post('/applications/:applicationId/comments', authenticate, Controller.createComment);

// Update a comment
router.put('/comments/:commentId', authenticate, Controller.updateComment);

// Delete a comment
router.delete('/comments/:commentId', authenticate, Controller.deleteComment);

export default router;
