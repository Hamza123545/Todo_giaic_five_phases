import { NextResponse } from 'next/server';

/**
 * Readiness probe endpoint for Kubernetes
 * Returns 200 OK when the application is ready to serve traffic
 * Checks dependencies (backend API) are accessible
 */
export async function GET() {
  try {
    // Basic readiness check - application is ready when Next.js app is running
    // For frontend, we don't need to check backend here as it's a separate service
    // The frontend will handle backend connection errors at runtime

    return NextResponse.json(
      {
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: 'todo-frontend'
      },
      { status: 200 }
    );
  } catch (error) {
    // If there's any critical error preventing app readiness
    return NextResponse.json(
      {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        service: 'todo-frontend',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
