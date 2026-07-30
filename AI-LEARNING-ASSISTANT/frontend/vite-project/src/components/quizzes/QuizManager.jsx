import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import quizService from '../../services/quizService';
import aiService from '../../services/aiService';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import Modal from '../common/Modal';
import QuizCard from './QuizCard';
import EmptyState from '../common/EmptyState';

const QuizManager = ({documentId}) => {

    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [numQuestions, setNumQuestions] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const quizzes = await quizService.getQuizzesForDocument(documentId);
            setQuizzes(Array.isArray(quizzes) ? quizzes : []);
        } catch(error){
            toast.error('Failed to fetch quizzes.');
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(documentId) {
            fetchQuizzes();
        }
    }, [documentId]);

    const handlegenerateQuiz = async (e) => {
        e.preventDefault();
        setGenerating(true);
        try {
            await aiService.generateQuiz(documentId, { numQuestions });
            toast.success('Quiz generated successfully!');
            setIsGenerateModalOpen(false);
            await fetchQuizzes();
        } catch (error){
            toast.error(error.message || 'Failed to generate quiz.');
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteRequest = (quiz) => {
        setSelectedQuiz(quiz);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if(!selectedQuiz) return;
        setDeleting(true);
        try {
            await quizService.deleteQuiz(selectedQuiz._id);
            toast.success(`'${selectedQuiz.title || 'Quiz'}' deleted.`);
            setIsDeleteModalOpen(false);
            const deletedId = selectedQuiz._id;
            setSelectedQuiz(null);
            setQuizzes((prev) => (Array.isArray(prev) ? prev.filter(q => q._id !== deletedId) : []));
        } catch (error){
            toast.error(error.message || 'Failed to delete quiz.');
        } finally {
            setDeleting(false);
        }
    };

    const renderQuizContent = () => {
        if(loading) {
            return <Spinner />;
        }

        const safeQuizzes = Array.isArray(quizzes) ? quizzes : [];

        if(safeQuizzes.length === 0) {
            return (
                <EmptyState
                    title="No Quizzes yet"
                    description="Generate a quiz from your document to test your knowledge."
                />
            );
        }

        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {safeQuizzes.map((quiz) => (
                    <QuizCard key={quiz?._id || `quiz-${Math.random()}`} quiz={quiz} onDelete={handleDeleteRequest} />
                ))}
            </div>
        )
    };

  return (
    <div className='bg-white border border-neutral-200 rounded-lg p-6'>
        <div className='flex justify-end gap-2 mb-4'>
            <Button onClick={() => setIsGenerateModalOpen(true)} >
            <Plus size={16} />
            Generate Quiz
        </Button>
        </div>


        {renderQuizContent()}

        {/* Generate Quiz */}
        <Modal
            isOpen={isGenerateModalOpen}
            onClose={() => setIsGenerateModalOpen(false)}
            title="Generate New Quiz"
        >
            <form onSubmit={handlegenerateQuiz} className='space-y-4'>
                <div>
                    <label className='block text-xs font-medium text-neutral-700 mb-1.5'>
                        number of Questions
                    </label>
                    <input
                        type='number'
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        required
                        className='w-full h-9 px-3 border border-neutral-200 rounded-lg bg-white text-sm text-neutral-900 placeholder-neutral-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#00d492] focus focus:border-transparent'
                    />
                </div>
                <div className='flex justify-end gap-2 pt-2'>
                    <Button 
                        type='button'
                        variant='secondary'
                        onClick={() => setIsGenerateModalOpen(false)}
                        disabled={generating}
                    >
                        Cancel
                    </Button>
                    <Button type='submit' disabled={generating}>
                        {generating ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
            </form>
        </Modal>


        {/* Delete Confirmation */}
        <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Confirm Delete Quiz"
        >
            <div className='space-y-4'>
                <p className='text-sm text-neutral-600'>
                    Are you sure you want to delete the quiz: <span className='font-semibold text-neutral-900'>{selectedQuiz?.title || 'this quiz'}</span>? This action cannot be undone.
                </p>
                <div className='flex justify-end gap-2 pt-2'>
                    <Button
                        type='button'
                        variant='outline'
                        onClick={() => setIsDeleteModalOpen(false)}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        className='bg-red-500 hover:bg-red-600 active:bg-red-700 focus:ring-red-500'
                    >
                        {deleting ? 'Deleting...' :'Delete'}
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
  )
}

export default QuizManager