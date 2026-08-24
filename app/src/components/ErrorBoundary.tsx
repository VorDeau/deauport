import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { fallback: ReactNode; children: ReactNode; resetKey?: string | number };
type State = { failed: boolean; seen: string | number | undefined };

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false, seen: undefined };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey === state.seen) return null;
    return { failed: false, seen: props.resetKey };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("3D view failed, falling back to the text summary:", error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
