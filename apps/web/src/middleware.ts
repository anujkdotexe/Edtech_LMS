import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

interface DecodedTokenPayload {
  userId?: string;
  role?: string;
  impersonatedBy?: string;
}

async function verifyToken(token: string): Promise<DecodedTokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'supersecretsigningkeymustbeatleast32charslong!!!'
    );
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as DecodedTokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token =
    request.cookies.get('impersonationToken')?.value ||
    request.cookies.get('token')?.value;

  if (pathname.startsWith('/admin') || pathname.startsWith('/dev')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Protect admin routes: requires ADMIN or DEVELOPER
    if (pathname.startsWith('/admin') && !['ADMIN', 'DEVELOPER'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Protect dev routes: requires DEVELOPER
    if (pathname.startsWith('/dev') && payload.role !== 'DEVELOPER') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dev/:path*'],
};
