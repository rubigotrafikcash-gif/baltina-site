import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const isDraft = import.meta.env.PUBLIC_DRAFT !== 'false';

  const body = isDraft
    ? // Черновик не должен попасть в поиск.
      ['User-agent: *', 'Disallow: /', ''].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${new URL(`${import.meta.env.BASE_URL.replace(/\/?$/, '/')}sitemap-index.xml`, site).href}`,
        '',
      ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
