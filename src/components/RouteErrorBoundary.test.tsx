import React from 'react';
import { render, screen } from '@testing-library/react';
import RouteErrorBoundary from './RouteErrorBoundary';

const BrokenRoute = () => {
  throw new Error('route crashed');
};

describe('RouteErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const swallowExpectedRouteCrash = (event: ErrorEvent) => {
    if (event.error instanceof Error && event.error.message === 'route crashed') {
      event.preventDefault();
    }
  };

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.addEventListener('error', swallowExpectedRouteCrash);
  });

  afterEach(() => {
    window.removeEventListener('error', swallowExpectedRouteCrash);
    consoleErrorSpy.mockRestore();
  });

  it('shows a route recovery screen when a routed page crashes', () => {
    render(
      <RouteErrorBoundary routeKey="/dashboard">
        <BrokenRoute />
      </RouteErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: /this page hit a loading problem/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('resets the recovery screen when the route changes', () => {
    const { rerender } = render(
      <RouteErrorBoundary routeKey="/dashboard">
        <BrokenRoute />
      </RouteErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: /this page hit a loading problem/i })).toBeInTheDocument();

    rerender(
      <RouteErrorBoundary routeKey="/job-tracker">
        <main>Job tracker loaded</main>
      </RouteErrorBoundary>
    );

    expect(screen.queryByRole('heading', { name: /this page hit a loading problem/i })).not.toBeInTheDocument();
    expect(screen.getByText('Job tracker loaded')).toBeInTheDocument();
  });
});
