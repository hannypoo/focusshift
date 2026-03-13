import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
          <div className="w-full max-w-sm text-center space-y-4">
            <div className="text-4xl mb-2">😵‍💫</div>
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-white/50 text-sm">
              Don't worry — it's not you, it's us. Try reloading.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors"
            >
              Reload
            </button>
            {this.state.error && (
              <p className="text-white/20 text-xs mt-4 break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
