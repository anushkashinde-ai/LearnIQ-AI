import express from 'express';
import {
    getAllQuizzesForUser,
    getQuizzes,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz
} from '../controller/quizController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllQuizzesForUser);
router.get('/document/:documentId', getQuizzes);
router.get('/:quizId', getQuizById);
router.post('/:quizId/submit', submitQuiz);
router.get('/:quizId/results', getQuizResults);
router.delete('/:quizId', deleteQuiz);

export default router;
