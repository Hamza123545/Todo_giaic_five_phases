import { NextResponse } from 'next/server';

/**
 * Liveness probe endpoint for Kubernetes
 * Returns 200 OK if the application process is alive
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'todo-frontend'
    },
    { status: 200 }
  );
}
