import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative flex min-h-screen items-center justify-center bg-bg-primary">
          <div className="orb orb-orange" />
          <div className="orb orb-amber" />
          <div className="glass-elevated relative z-10 flex w-full max-w-[400px] flex-col items-center gap-5 rounded-2xl p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
              <AlertTriangle className="h-6 w-6 text-danger" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                Une erreur inattendue est survenue.
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Essayez de recharger la page. Si le problème persiste, contactez le coordinateur.
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_rgba(245,146,10,0.2)] transition-all duration-200 hover:brightness-110"
            >
              <RefreshCw className="h-4 w-4" />
              Recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
