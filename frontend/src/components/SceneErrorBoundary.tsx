import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SceneErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ULPIN 3D] Uncaught rendering exception in 3D scene:', error, errorInfo)
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, error: null })
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="scene-error-fallback" role="alert">
          <div className="error-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32" aria-hidden="true">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h2>3D Visualization Error</h2>
            <p className="error-desc">
              The 3D graphics renderer encountered an unexpected issue (e.g. WebGL context loss).
            </p>
            {this.state.error && (
              <pre className="error-detail">{this.state.error.message}</pre>
            )}
            <button
              type="button"
              className="error-retry-btn"
              onClick={this.handleReload}
            >
              Reload 3D Scene
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
