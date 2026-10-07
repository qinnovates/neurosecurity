import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** Named in the message so the user knows which part failed. */
  modeLabel: string;
  children: ReactNode;
}

interface State {
  hasFailed: boolean;
}

/**
 * Contains a failure inside one mode. The device in focus lives above this boundary,
 * so a mode that cannot load or render does not lose the user's work.
 */
export default class ModeErrorBoundary extends Component<Props, State> {
  state: State = { hasFailed: false };

  static getDerivedStateFromError(): State {
    return { hasFailed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Kept in the browser console only: this page sends nothing anywhere.
    console.error(`[TARA Lab] ${this.props.modeLabel} failed to render`, error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasFailed) return this.props.children;
    return (
      <div className="tm-notice" role="alert">
        <p><strong>{this.props.modeLabel} could not be shown.</strong> Your device is still in memory and the other modes still work.</p>
        <button type="button" className="tm-button" onClick={() => this.setState({ hasFailed: false })}>Try again</button>
      </div>
    );
  }
}
