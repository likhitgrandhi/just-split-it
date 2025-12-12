import React from 'react';

export const HistoryView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
      <h1 className="text-3xl font-black text-cloud-text mb-4">History</h1>
      <p className="text-cloud-subtext">Your past activities will appear here.</p>
    </div>
  );
};

