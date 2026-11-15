import { Component, type ReactNode } from 'react';
import { Orbit } from 'lucide-react';
import { Button } from './ui';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="error-screen">
        <Orbit size={44} />
        <h1>Let’s reconnect your console.</h1>
        <p>Your saved progress is still on this device or your account.</p>
        <Button onClick={() => window.location.reload()}>Reload AstroQuest</Button>
      </main>
    );
  }
}
