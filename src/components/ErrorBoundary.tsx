import React from 'react';

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    try {
      console.error('ChangeFlow crash:', error, info.componentStack);
    } catch {
      /* ignore */
    }
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] dark:bg-[#0A0E14] p-6">
          <div className="max-w-md rounded-2xl border border-red-300 bg-white dark:bg-[#11161F] p-6 text-sm">
            <h1 className="font-bold text-lg mb-2">Xəta baş verdi / Something went wrong</h1>
            <p className="text-slate-500 mb-2">
              Qaralamanız yadda saxlanılır — app-i yenidən başladın. / Your draft is saved — please restart the app.
            </p>
            <pre className="text-xs bg-slate-100 dark:bg-white/5 rounded-lg p-2 overflow-auto max-h-40">
              {String(this.state.error.message || this.state.error)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 rounded-lg bg-[#1D4ED8] text-white"
            >
              Yenidən başlat / Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
