import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Allowed root domains (development and production)
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isMainDomain = hostname.includes('zmkbeauty.com');
  const isVercelDomain = hostname.includes('vercel.app');

  // If it's a custom domain, rewrite the URL
  if (!isLocalhost && !isMainDomain && !isVercelDomain) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    
    try {
      // Fetch the store slug associated with this custom domain
      // Since fetch inside edge middleware can be tricky depending on the host, 
      // this needs to be a fast endpoint.
      const res = await fetch(`${apiUrl}/tenants/domain/${hostname}`);
      
      if (res.ok) {
        const { slug } = await res.json();
        // Rewrite the request to the dynamic /[storeSlug] route
        // E.g. custom-salon.com/about -> zmkbeauty.com/custom-salon-slug/about
        url.pathname = `/${slug}${url.pathname}`;
        return NextResponse.rewrite(url);
      }
    } catch (e) {
      console.error('Custom domain fetch error:', e);
      // Fallback if domain not found
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, public files)
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
