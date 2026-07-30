import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

const buildDetailedResults = (quiz) => {
    const byIndex = new Map();
    for (const a of quiz.userAnswers || []) {
        if (typeof a?.questionIndex === 'number') byIndex.set(a.questionIndex, a);
    }

    const safeQuestions = Array.isArray(quiz.questions) ? quiz.questions : [];
    return safeQuestions.map((question, index) => {
        const userAnswer = byIndex.get(index);
        const correctAnswerText = question?.correctAnswer ?? '';
        const selectedAnswerText = userAnswer
            ? (userAnswer.selectedAnswer == null ? null : String(userAnswer.selectedAnswer))
            : null;
        const isCorrect = Boolean(userAnswer?.isCorrect)
            || (selectedAnswerText != null && selectedAnswerText === correctAnswerText);

        return {
            questionIndex: index,
            questionId: question?._id,
            question: question?.question ?? '',
            options: Array.isArray(question?.options) ? question.options : [],
            correctAnswer: correctAnswerText,
            selectedAnswer: selectedAnswerText,
            isCorrect,
            explanation: question?.explanation ?? '',
            difficulty: question?.difficulty ?? 'medium',
        };
    });
};

const quizDto = (quiz) => {
    const safeQuestions = Array.isArray(quiz.questions) ? quiz.questions : [];
    const document = quiz.documentId && typeof quiz.documentId === 'object'
        ? {
            _id: quiz.documentId._id,
            id: quiz.documentId._id,
            title: quiz.documentId.title,
            fileName: quiz.documentId.fileName,
        }
        : quiz.documentId;

    return {
        id: quiz._id,
        _id: quiz._id,
        title: quiz.title,
        document,
        documentId: quiz.documentId?._id || quiz.documentId,
        score: quiz.score ?? 0,
        totalQuestions: quiz.totalQuestions || safeQuestions.length,
        completedAt: quiz.completedAt,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
        questions: safeQuestions,
    };
};

export const getAllQuizzesForUser = async (req, res, next) => {
    try {
        const quizzes = await Quiz.find({
            userId: req.user._id,
        })
            .populate('documentId', 'title fileName')
            .sort({ updatedAt: -1, createdAt: -1 });

        const seen = new Map();
        for (const q of quizzes) {
            const key = String(q.documentId?._id || q.documentId);
            if (!key) continue;
            if (!seen.has(key)) seen.set(key, q);
        }
        const deduped = quizzes.length === seen.size
            ? quizzes
            : Array.from(seen.values()).sort((a, b) => {
                const aT = (a.updatedAt || a.createdAt)?.getTime?.() || 0;
                const bT = (b.updatedAt || b.createdAt)?.getTime?.() || 0;
                return bT - aT;
              });

        res.status(200).json({
            success: true,
            count: deduped.length,
            data: deduped,
        });
    } catch (error) {
        next(error);
    }
};

export const getQuizzes = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        if (!isValidObjectId(documentId)) {
            return res.status(404).json({
                success: false,
                error: 'Document not found (invalid id)',
                statusCode: 404,
            });
        }

        const quizzes = await Quiz.find({
            userId: req.user._id,
            documentId,
        })
            .populate('documentId', 'title fileName')
            .sort({ updatedAt: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: quizzes.length,
            data: quizzes,
        });
    } catch (error) {
        next(error);
    }
};

export const getQuizById = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        if (!isValidObjectId(quizId)) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found (invalid id)',
                statusCode: 404,
            });
        }

        const quiz = await Quiz.findOne({
            _id: quizId,
            userId: req.user._id,
        }).populate('documentId', 'title fileName');

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404,
            });
        }

        res.status(200).json({
            success: true,
            data: quiz,
        });
    } catch (error) {
        next(error);
    }
};

export const submitQuiz = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        if (!isValidObjectId(quizId)) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found (invalid id)',
                statusCode: 404,
            });
        }

        const { answers } = req.body;

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide answers array',
                statusCode: 400,
            });
        }

        const quiz = await Quiz.findOne({
            _id: quizId,
            userId: req.user._id,
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404,
            });
        }

        if (quiz.completedAt) {
            return res.status(400).json({
                success: false,
                error: 'Quiz already completed',
                statusCode: 400,
            });
        }

        const safeQuestions = Array.isArray(quiz.questions) ? quiz.questions : [];
        const questionsById = new Map();
        safeQuestions.forEach((question, idx) => {
            questionsById.set(String(question._id), { question, idx });
        });

        let correctCount = 0;
        const userAnswers = [];

        for (const answer of answers) {
            const { questionId, questionIndex, selectedAnswer } = answer || {};
            let entry;
            if (questionId != null && questionsById.has(String(questionId))) {
                entry = questionsById.get(String(questionId));
            } else if (typeof questionIndex === 'number' && safeQuestions[questionIndex]) {
                entry = { question: safeQuestions[questionIndex], idx: questionIndex };
            } else {
                continue;
            }

            const selectedOptionText = typeof selectedAnswer === 'number'
                ? (entry.question.options?.[selectedAnswer] ?? String(selectedAnswer))
                : (selectedAnswer == null ? '' : String(selectedAnswer));

            const correctOptionText = String(entry.question.correctAnswer ?? '');

            // Handle both formats: correctAnswer stored as option text OR stored as "01"/"02" index label (old docs)
            let isCorrect = false;
            if (selectedOptionText === correctOptionText) {
                isCorrect = true;
            } else if (/^0\d$/.test(correctOptionText)) {
                const correctIdx = parseInt(correctOptionText, 10) - 1;
                if (Number.isInteger(correctIdx) && entry.question.options?.[correctIdx] === selectedOptionText) {
                    isCorrect = true;
                }
            }

            if (isCorrect) correctCount++;

            userAnswers.push({
                questionIndex: entry.idx,
                selectedAnswer: selectedOptionText,
                isCorrect,
                answeredAt: new Date(),
            });
        }

        const totalQ = safeQuestions.length || quiz.totalQuestions || userAnswers.length;
        const score = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

        quiz.userAnswers = userAnswers;
        quiz.score = score;
        quiz.totalQuestions = totalQ;
        quiz.completedAt = new Date();
        quiz.markModified('userAnswers');

        await quiz.save();

        const populated = await Quiz.findOne({ _id: quiz._id })
            .populate('documentId', 'title fileName');

        const detailedResults = buildDetailedResults(populated || quiz);

        res.status(200).json({
            success: true,
            data: {
                quiz: quizDto(populated || quiz),
                results: detailedResults,
                meta: {
                    quizId: quiz._id,
                    score,
                    correctCount,
                    totalQuestions: totalQ,
                    percentage: score,
                },
            },
            message: 'Quiz submitted successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const getQuizResults = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        if (!isValidObjectId(quizId)) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found (invalid id)',
                statusCode: 404,
            });
        }

        const quiz = await Quiz.findOne({
            _id: quizId,
            userId: req.user._id,
        }).populate('documentId', 'title fileName');

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404,
            });
        }

        if (!quiz.completedAt) {
            return res.status(400).json({
                success: false,
                error: 'Quiz not completed yet',
                statusCode: 400,
            });
        }

        const detailedResults = buildDetailedResults(quiz);

        res.status(200).json({
            success: true,
            data: {
                quiz: quizDto(quiz),
                results: detailedResults,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteQuiz = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        if (!isValidObjectId(quizId)) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found (invalid id)',
                statusCode: 404,
            });
        }

        const quiz = await Quiz.findOne({
            _id: quizId,
            userId: req.user._id,
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404,
            });
        }

        await quiz.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Quiz deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
