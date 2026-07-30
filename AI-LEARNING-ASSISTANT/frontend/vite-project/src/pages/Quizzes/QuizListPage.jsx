import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import toast from 'react-hot-toast';

import quizService from '../../services/quizService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import QuizCard from '../../components/quizzes/QuizCard';
import Modal from '../../components/common/Modal';
import { useNavigate } from 'react-router-dom';

const QuizListPage = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const result = await quizService.getAllQuizzes();
        setQuizzes(Array.isArray(result) ? result : []);
      } catch (error) {
        toast.error(error?.message || 'Failed to fetch quizzes.');
        console.error(error);
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const handleDeleteRequest = (quiz) => {
    setQuizToDelete(quiz);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!quizToDelete) return;
    try {
      setDeleting(true);
      await quizService.deleteQuiz(quizToDelete._id);
      toast.success('Quiz deleted successfully.');
      const deletedId = quizToDelete._id;
      setQuizzes((prev) =>
        (Array.isArray(prev) ? prev : []).filter((q) => q._id !== deletedId)
      );
      setIsDeleteModalOpen(false);
      setQuizToDelete(null);
    } catch (error) {
      toast.error(error?.message || 'Failed to delete quiz.');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = () => {
    if (loading) return <Spinner />;
    const safe = Array.isArray(quizzes) ? quizzes : [];

    if (safe.length === 0) {
      return (
        <EmptyState
          icon={Brain}
          title="No Quizzes yet"
          description="Upload a document and generate your first quiz to start testing your knowledge."
          buttonText="Go to Documents"
          onActionClick={() => navigate('/documents')}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {safe.map((quiz) => (
          <QuizCard
            key={quiz?._id || `quiz-${Math.random()}`}
            quiz={quiz}
            onDelete={handleDeleteRequest}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Quizzes" description="Test your knowledge with AI-generated quizzes from your documents." />
      {renderContent()}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setIsDeleteModalOpen(false);
            setQuizToDelete(null);
          }
        }}
        title="Delete Quiz"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900">
              {quizToDelete?.title || 'this quiz'}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setQuizToDelete(null);
              }}
              disabled={deleting}
              className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-5 h-11 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'Deleting...' : 'Delete Quiz'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuizListPage;
