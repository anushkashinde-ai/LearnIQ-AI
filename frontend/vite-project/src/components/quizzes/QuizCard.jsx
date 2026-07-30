import React from 'react';
import { Link } from 'react-router-dom';
import { Play, BarChart2, Trash2, Award } from 'lucide-react';
import moment from 'moment';

const QuizCard = ({ quiz, onDelete }) => {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const title = quiz?.title || `Quiz - ${moment(quiz?.createdAt).format("MMM D, YYYY")}`;
  const score = quiz?.score;
  const taken = Array.isArray(quiz?.userAnswers) && quiz.userAnswers.length > 0;

  return (
    <div className='group relative bg-white/80 backdrop-blur-xl border-2 border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between'>
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (typeof onDelete === 'function') onDelete(quiz);
            }}
            className='absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100'
        >
            <Trash2 className='w-4 h-4' strokeWidth={2} />
        </button>

        <div className='space-y-4'>
            <div className='inline-flex items-center gap-1.5 py-1 rounded-lg text-xs font-semibold'>
                <div className='flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1'>
                    <Award className='w-3.5 h-3.5 text-emerald-600' strokeWidth={2.5} />
                    <span className='text-emerald-700'>
                        Score: {taken ? (score != null ? score : '-') : 'Not taken'}
                    </span>
                </div>
            </div>

            <div>
                <h3
                    className='text-base font-semibold text-slate-900 mb-1 line-clamp-2'
                    title={title}
                >
                    {title}
                </h3>
                <p className='text-xs font-medium text-slate-500 uppercase tracking-wide'>
                    Created {moment(quiz?.createdAt).format("MMM D, YYYY")}
                </p>
            </div>

            <div className='flex items-center gap-3 pt-2 border-t border-slate-100'>
                <div className='px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg'>
                    <span className='text-sm font-semibold text-slate-700'>
                        {questions.length}{" "}
                        {questions.length === 1 ? "Question" : "Questions"}
                    </span>
                </div>
            </div>
        </div>

        <div className='mt-2 pt-4 border-t border-slate-100'>
            {taken ? (
                <Link to={`/quizzes/${quiz?._id}/results`}>
                    <button className='group/btn w-full inline-flex items-center justify-center gap-2 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all duration-200 active:scale-95 cursor-pointer'>
                        <BarChart2 className='w-4 h-4' strokeWidth={2.5} />
                        View Results
                    </button>
                </Link>
            ) : (
                <Link to={`/quizzes/${quiz?._id}`}>
                    <button className='group/btn relative w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 overflow-hidden'>
                        <span className='relative z-10 flex items-center justify-center gap-2'>
                            <Play className='w-4 h-4' strokeWidth={2.5} />
                            Start Quiz
                        </span>
                        <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700' />
                    </button>
                </Link>
            )}
        </div>
    </div>
  );
};

export default QuizCard;
