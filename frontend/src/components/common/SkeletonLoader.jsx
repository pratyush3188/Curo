import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full divide-y divide-slate-100 dark:divide-slate-800 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 px-6 py-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 bg-slate-200 dark:bg-slate-800 rounded-md ${
                cIdx === 0 ? 'w-1/4' : cIdx === 1 ? 'w-1/6' : 'flex-1'
              }`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-7 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          </div>
          <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded pt-2"></div>
        </div>
      ))}
    </div>
  );
};

export const DrawerSkeleton = () => {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        <div className="space-y-2 flex-1">
          <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
      <div className="space-y-3 pt-4">
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    </div>
  );
};
