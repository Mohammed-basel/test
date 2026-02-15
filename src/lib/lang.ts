export type Lang = 'ar' | 'en';

export function getLangFromPathname(pathname: string = window.location.pathname): Lang {
  const p = (pathname || '').toLowerCase();
  // Treat any URL containing /en/ or ending with /en as English
  if (p.includes('/en/') || p.endsWith('/en')) return 'en';
  return 'ar';
}

export function dirFromLang(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}
