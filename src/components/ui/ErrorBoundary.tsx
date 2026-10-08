import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="font-display text-6xl font-bold gradient-text mb-4">Oops</div>
            <p className="text-white/50 mb-6">
              Something went wrong. Please refresh the page or return home.
            </p>
            <Link
              to="/"
              className="inline-flex h-12 items-center justify-center px-6 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-all"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Back to Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
