
import React from 'react';

export const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-10">
        <div className="w-12 h-12 border-4 border-t-4 border-t-indigo-500 border-slate-200 dark:border-slate-700 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">AI is analyzing your document...</p>
    </div>
);
