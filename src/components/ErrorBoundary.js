import React from 'react';
import analyticsService from '../services/analyticsService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to analytics
    analyticsService.trackError(error, {
      errorInfo,
      componentStack: errorInfo.componentStack,
      context: 'ErrorBoundary'
    });

    // Store error details in state
    this.setState({
      error,
      errorInfo
    });

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    // Clear error state and reload
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    // Clear error state and navigate to home
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p className="error-description">
              We're sorry, but something unexpected happened. Don't worry, your data is safe!
            </p>
            
            <div className="error-actions">
              <button className="error-btn primary" onClick={this.handleReload}>
                🔄 Reload Page
              </button>
              <button className="error-btn secondary" onClick={this.handleGoHome}>
                🏠 Go Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Mode)</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error && this.state.error.toString()}</pre>
                  
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
