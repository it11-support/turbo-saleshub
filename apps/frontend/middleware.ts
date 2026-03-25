import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { menuConfig } from './lib/menuConfig'
import { MenuItem, Role, RouteMenuItem } from '@saleshub-tsm/types'

// Routes that don't require authentication
const PUBLIC_FILE = /(.*)\.(.*)$/
const AUTH_PATHS = ['/auth', '/auth/login', '/auth/register']
type AugmentedItem = MenuItem & { sectionRoles: Role[] | undefined };
type AugmentedRouteItem = RouteMenuItem & { sectionRoles: Role[] | undefined };


// 1. Variabel ini sekarang berisi rute yang HANYA boleh diakses Admin
const ADMIN_ONLY_PATHS = menuConfig.flatMap((section) =>
  section.items
    .filter((item): item is RouteMenuItem => 'to' in item)
    .filter((item) => {
      const roles = item.roles || section.roles;
      // Syarat blokir Sales: Ada 'admin' tapi TIDAK ADA 'sales'
      return roles?.includes('admin') && !roles?.includes('sales');
    })
    .map((item) => item.to)
);

// 2. Variabel ini sekarang berisi rute yang HANYA boleh diakses Sales (Opsional)
const SALES_ONLY_PATHS = menuConfig.flatMap((section) =>
  section.items
    .filter((item): item is RouteMenuItem => 'to' in item)
    .filter((item) => {
      const roles = item.roles || section.roles;
      // Syarat blokir Admin: Ada 'sales' tapi TIDAK ADA 'admin'
      return roles?.includes('sales') && !roles?.includes('admin');
    })
    .map((item) => item.to)
);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('accessToken')?.value;
  const isAdmin = req.cookies.get('isAdmin')?.value === 'true';

  // [A] Bypass Statis & API
  if (pathname.startsWith('/_next') || PUBLIC_FILE.test(pathname)) return NextResponse.next();

  // [B] Auth Logic
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (token) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  // [C] Token Check
  if (!token) return NextResponse.redirect(new URL('/auth/login', req.url));

  // [D] LOGIKA AKSES BARU

  // 1. Jika rute HANYA untuk Admin, tapi user bukan Admin -> Forbidden
  const isRestrictedForSales = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
  if (isRestrictedForSales && !isAdmin) {
    return NextResponse.redirect(new URL('/forbidden', req.url));
  }

  // 2. Jika rute HANYA untuk Sales, tapi user adalah Admin -> Forbidden
  const isRestrictedForAdmin = SALES_ONLY_PATHS.some((p) => pathname.startsWith(p));
  if (isRestrictedForAdmin && isAdmin) {
    return NextResponse.redirect(new URL('/forbidden', req.url));
  }

  // 3. Jika rute tidak ada roles atau ada keduanya, semua lolos
  return NextResponse.next();
}


export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
