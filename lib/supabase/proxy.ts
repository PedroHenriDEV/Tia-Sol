import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublic = pathname === '/' || pathname === '/login' || pathname.startsWith('/login/');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail closed for private routes: missing auth configuration must never
  // silently allow requests to protected pages.
  if (!url || !anonKey) {
    if (isPublic) return NextResponse.next({ request });

    return NextResponse.json(
      { error: 'Serviço de autenticação indisponível. Verifique a configuração do Supabase.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();

  // If the auth service cannot validate the session, do not treat it as an
  // authenticated user. Private pages will be redirected to login below.
  const user = error ? null : data.user;

  if (!user && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/login';
    redirect.search = '';
    redirect.searchParams.set('next', pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && (pathname === '/login' || pathname.startsWith('/login/'))) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/dashboard';
    redirect.search = '';
    return NextResponse.redirect(redirect);
  }

  return response;
}
