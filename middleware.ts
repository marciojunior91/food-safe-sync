import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname;
  
  // If it's an API route or static file, let it through
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // has file extension
  ) {
    return NextResponse.next();
  }
  
  // For all other routes, rewrite to index.html
  return NextResponse.rewrite(new URL('/', request.url));
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
