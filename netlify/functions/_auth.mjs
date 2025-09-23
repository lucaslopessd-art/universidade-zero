export function getUser(context) {
  return context.clientContext?.user || null;
}

export function requireUser(context) {
  const user = getUser(context);
  if (!user) {
    return [null, new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { 'content-type': 'application/json' }
    })];
  }
  return [user, null];
}

export function isAdmin(user) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const email = (user?.email || '').toLowerCase();
  const roles = user?.app_metadata?.roles || [];
  return email === adminEmail || roles.includes('gestor') || roles.includes('gerente');
}
