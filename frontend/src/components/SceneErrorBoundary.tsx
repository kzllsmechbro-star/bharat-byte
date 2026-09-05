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
            <span className="error-icon">⚠️</span>
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
              🔄 Reload 3D Scene
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
