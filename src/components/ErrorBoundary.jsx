import { Component } from 'react';
import ServerErrorPage from '../pages/ServerErrorPage';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ServerErrorPage />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
