import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/tasks'];

const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');
  const refreshToken = request.cookies.get('refresh_token');
  
  const isAuthenticated = !!refreshToken;
  
  const { pathname } = request.nextUrl;
  
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    const url = new URL('/sign-in', request.url);
    return NextResponse.redirect(url);
  }
  
  if (AUTH_ROUTES.some(route => pathname.startsWith(route)) && isAuthenticated) {
    const url = new URL('/tasks', request.url);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [...PROTECTED_ROUTES, ...AUTH_ROUTES],
};