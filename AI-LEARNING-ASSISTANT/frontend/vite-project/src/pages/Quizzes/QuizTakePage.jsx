import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import quizService from "../../services/quizService";
import PageHeader from "../../components/common/PageHeader";
import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";

const QuizTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const result = await quizService.getQuizById(quizId);
        setQuiz(result);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch quiz.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleOptionChange = (questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const safeQuestions = Array.isArray(quiz?.questions) ? quiz.questions : [];

  const handleNextQuestion = () => {
    if (currentQuestionIndex < safeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(selectedAnswers).length !== safeQuestions.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      const answers = safeQuestions.map((question) => ({
        questionId: question._id,
        questionIndex: safeQuestions.indexOf(question),
        selectedAnswer: selectedAnswers[question._id],
      }));

      const result = await quizService.submitQuiz(quizId, answers);

      toast.success("Quiz submitted successfully!");

      navigate(`/quizzes/${quizId}/results`, {
        state: {
          result,
        },
      });
    } catch (error) {
      console.error(error);

      toast.error(
        error?.message ||
          error?.error ||
          "Failed to submit quiz."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!quiz || safeQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 text-lg">
            Quiz not found or has no questions.
          </p>

          <Button
            className="mt-6"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = safeQuestions[currentQuestionIndex];
  const isAnswered = Object.prototype.hasOwnProperty.call(
    selectedAnswers,
    currentQuestion._id
  );
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title={quiz.title || "Take Quiz"} />

      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Question {currentQuestionIndex + 1} of {safeQuestions.length}
          </span>

          <span className="text-sm font-medium text-slate-500">
            {answeredCount} answered
          </span>
        </div>

        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{
              width: `${((currentQuestionIndex + 1) / safeQuestions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="mb-6">
          <span className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-sm">
            Question {currentQuestionIndex + 1}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-8">
          {currentQuestion.question}
        </h2>

        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected =
              selectedAnswers[currentQuestion._id] === index;

            return (
              <label
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-emerald-300"
                }`}
              >
                <input
                  type="radio"
                  className="hidden"
                  checked={isSelected}
                  onChange={() =>
                    handleOptionChange(currentQuestion._id, index)
                  }
                />

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-slate-400"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>

                <span className="text-slate-700 font-medium flex-1">
                  {option}
                </span>

                {isSelected && (
                  <CheckCircle2
                    className="text-emerald-500"
                    size={20}
                  />
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          variant="secondary"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0 || submitting}
        >
          <ChevronLeft size={18} />
          Previous
        </Button>

        {currentQuestionIndex === safeQuestions.length - 1 ? (
          <Button
            onClick={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                Submit Quiz
                <CheckCircle2 size={18} />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            disabled={submitting}
          >
            Next
            <ChevronRight size={18} />
          </Button>
        )}
      </div>

      <div className="flex justify-center gap-2 mt-10 flex-wrap">
        {safeQuestions.map((question, index) => {
          const answered = Object.prototype.hasOwnProperty.call(
            selectedAnswers,
            question._id
          );

          return (
            <button
              key={question._id}
              onClick={() => setCurrentQuestionIndex(index)}
              disabled={submitting}
              className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                index === currentQuestionIndex
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                  : answered
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizTakePage;
