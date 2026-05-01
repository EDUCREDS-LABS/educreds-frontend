import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50/50">
          <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="h-2 bg-destructive" />
            <CardHeader className="text-center pt-10">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-destructive animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-bold text-neutral-900">System Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center px-8 pb-10 space-y-6">
              <p className="text-neutral-600 leading-relaxed">
                An unexpected system error has occurred. Our engineers have been notified.
                Please try refreshing the platform.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-all font-semibold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Platform
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/'}
                  className="w-full h-12 rounded-xl text-neutral-500 hover:text-neutral-900"
                >
                  Return to Home
                </Button>
              </div>
              {import.meta.env.DEV && this.state.error && (
                <div className="mt-6 text-left p-4 bg-neutral-100 rounded-xl overflow-auto max-h-40">
                  <p className="text-xs font-mono text-neutral-500 break-all">
                    {this.state.error.stack}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}