import React from 'react'

const PageHeader = ({title, subtitle, children}) => {
  return (
    <div className='flex items-center justify-between mb-6'>
        <div>
            <h1 className='text-2xl font-medium text-slate-900 tracking-tight mb-2'>
                {title}
            </h1>
            {subtitle && (
                <p className='text-slate-500 text-sm'>
                    {subtitle}
                </p>
            )}
        </div>
        {children && <div>{children}</div>}
    </div>
  )
}

export default PageHeader