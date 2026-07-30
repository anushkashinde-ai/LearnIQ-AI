import React from 'react';
import {FileText, Plus} from 'lucide-react';

const EmptyState = ({onActionClick, title, description, buttonText}) => {
  return (
    <div className='flex flex-col items-center justify-center py-16 px-6 text-center bg-linear-to-br from-slate-50/50 to-white border-2 border-dashed border-slate-200 rounded-3xl'>
        <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200/50 mb-6'>
            <FileText className='w-8 h-8 text-slate-400' strokeWidth={2} />
        </div>
        <h3 className='text-lg font-semibold text-slate-900 mb-2'>{title}</h3>
        <p className='text-sm text-slate-500 mb-8 max-w-sm leading-relaxed'>{description}</p>
        {buttonText && onActionClick && (
            <button
                onClick={onActionClick}
                className='group relative inline-flex items-center gap-2 px-6 h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 overflow-hidden'
            >
                <span className='relative z-10 flex items-center gap-2'>
                    <Plus className='w-4 h-4' strokeWidth={2.5} />
                    {buttonText}
                </span>
                <div className='absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700' />
            </button>
        )}
    </div>
  )
}

export default EmptyState