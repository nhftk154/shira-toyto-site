// Minimal GitHub OAuth proxy for Decap CMS (this site only).
// Secrets: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET (from this site's own GitHub OAuth App).
const SITE_ORIGIN = 'https://nhftk154.github.io';

const cookie = (name, value, maxAge) =>
  `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      const state = crypto.randomUUID();
      const u = new URL('https://github.com/login/oauth/authorize');
      u.searchParams.set('client_id', env.OAUTH_CLIENT_ID);
      u.searchParams.set('scope', 'repo');
      u.searchParams.set('state', state);
      u.searchParams.set('redirect_uri', `${url.origin}/callback`);
      return new Response(null, { status: 302, headers: { Location: u.toString(), 'Set-Cookie': cookie('st', state, 600) } });
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const saved = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)st=([^;]+)/)?.[1];
      if (!code || !state || state !== saved) return new Response('Invalid state', { status: 400 });

      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: env.OAUTH_CLIENT_ID, client_secret: env.OAUTH_CLIENT_SECRET, code })
      });
      const data = await res.json();
      if (data.error) return new Response(`OAuth error: ${data.error_description || data.error}`, { status: 400 });

      const msg = 'authorization:github:success:' + JSON.stringify({ token: data.access_token, provider: 'github' });
      const html = `<!doctype html><meta charset="utf-8"><script>
(function(){
  var msg=${JSON.stringify(msg)};
  function recv(e){
    if(e.origin!==${JSON.stringify(SITE_ORIGIN)})return;
    window.opener.postMessage(msg,e.origin);
    window.removeEventListener('message',recv,false);
    window.close();
  }
  window.addEventListener('message',recv,false);
  window.opener.postMessage('authorizing:github','*');
})();
</script>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': cookie('st', '', 0) } });
    }

    return new Response('Not found', { status: 404 });
  }
};
