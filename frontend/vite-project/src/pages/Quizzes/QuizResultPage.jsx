import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import quizService from "../../services/quizService";
import PageHeader from "../../components/common/PageHeader";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Target,
  BookOpen,
} from "lucide-react";

const QuizResultPage = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const [results, setResults] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);

  useEffect(() => {
    if (location.state?.result) return;
    const fetchResults = async () => {
      try {
        const data = await quizService.getQuizResults(quizId);
        setResults(data);
      } catch (error) {
        toast.error("Failed to fetch quiz results.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [quizId, location.state?.result]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!results || !results?.quiz || !Array.isArray(results?.results)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Quiz results not found.</p>
        </div>
      </div>
    );
  }

  const { quiz, results: detailedResults } = results;
  const score = quiz?.score ?? 0;
  const totalQuestions = detailedResults?.length || 0;
  const correctAnswers = detailedResults.filter((r) => r.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;

  const getScoreColor = (s) => {
    if (s >= 80) return "from-emerald-500 to-teal-500";
    if (s >= 60) return "from-amber-500 to-orange-500";
    return "from-rose-500 to-red-500";
  };

  const getScoreMessage = (s) => {
    if (s >= 90) return "Outstanding!";
    if (s >= 80) return "Good job!";
    if (s >= 70) return "Good Work!";
    if (s >= 60) return "Not bad!";
    return "Keep practicing!";
  };

  const documentId = quiz?.document?._id || quiz?.document;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          to={documentId ? `/documents/${documentId}` : "/quizzes"}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors duration-200"
        >
          <ArrowLeft
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200"
            strokeWidth={2}
          />
          Back to {documentId ? "Document" : "Quizzes"}
        </Link>
      </div>

      <PageHeader title={`${quiz.title || "Quiz"} Results`} />

      <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-8 mb-8">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg shadow-emerald-500/25">
            <Trophy className="w-8 h-8 text-emerald-600" strokeWidth={2} />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Your Score
            </p>
            <div
              className={`inline-block text-5xl font-bold bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent mb-2`}
            >
              {score}%
            </div>
            <p className="text-lg font-medium text-slate-700">
              {getScoreMessage(score)}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <Target className="w-4 h-4 text-slate-600" strokeWidth={2} />
              <span className="text-sm font-semibold text-slate-700">
                {totalQuestions} Total
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2
                className="w-4 h-4 text-emerald-600"
                strokeWidth={2}
              />
              <span className="text-sm font-semibold text-emerald-700">
                {correctAnswers} Correct
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl">
              <XCircle className="w-4 h-4 text-rose-600" strokeWidth={2} />
              <span className="text-sm font-semibold text-rose-700">
                {incorrectAnswers} Incorrect
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-5 h-5 text-slate-600" strokeWidth={2} />
          <h3 className="text-lg font-semibold text-slate-900">
            Detailed Review
          </h3>
        </div>

        {detailedResults.map((result, index) => {
          const userAnswerIndex = Array.isArray(result.options)
            ? result.options.findIndex((opt) => opt === result.selectedAnswer)
            : -1;
          const correctAnswerIndex = Array.isArray(result.options)
            ? result.options.findIndex((opt) => opt === result.correctAnswer)
            : -1;
          const isCorrect = result.isCorrect;

          return (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-2xl pt-6 pl-6 pr-6 pb-6 shadow-lg shadow-slate-200/50"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg mb-3">
                    <span className="text-xs font-semibold text-slate-600">
                      Question {index + 1}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 leading-relaxed">
                    {result.question}
                  </h4>
                </div>
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    isCorrect
                      ? "bg-emerald-50 border-2 border-emerald-200"
                      : "bg-rose-50 border-2 border-rose-200"
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2
                      className="w-5 h-5 text-emerald-600"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <XCircle
                      className="w-5 h-5 text-rose-600"
                      strokeWidth={2.5}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {Array.isArray(result.options) && result.options.map((option, optIndex) => {
                  const isCorrectOption = optIndex === correctAnswerIndex;
                  const isUserAnswer = optIndex === userAnswerIndex;
                  const isWrongAnswer = isUserAnswer && !isCorrect;

                  return (
                    <div
                      key={optIndex}
                      className={`relative px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        isCorrectOption
                          ? "bg-emerald-50 border-emerald-300 shadow-lg shadow-emerald-500/10"
                          : isWrongAnswer
                            ? "bg-rose-50 border-rose-300"
                            : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-sm font-medium ${
                            isCorrectOption
                              ? "text-emerald-900"
                              : isWrongAnswer
                                ? "text-rose-900"
                                : "text-slate-700"
                          }`}
                        >
                          {option}
                        </span>
                        <div className="flex items-center gap-2">
                          {isCorrectOption && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-700">
                              <CheckCircle2
                                className="w-3 h-3"
                                strokeWidth={2.5}
                              />
                              Correct
                            </span>
                          )}
                          {isWrongAnswer && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700">
                              <XCircle className="w-3 h-3" strokeWidth={2.5} />
                              Your Answer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {result.explanation && (
                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center mt-0.5">
                      <BookOpen
                        className="w-4 h-4 text-slate-600"
                        strokeWidth={2}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Explanation
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {result.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link to={documentId ? `/documents/${documentId}` : "/quizzes"}>
          <button className="group relative px-8 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" strokeWidth={2.5} />
              Return to {documentId ? "Document" : "Quizzes"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </Link>
      </div>
    </div>
  );
};

export default QuizResultPage;
