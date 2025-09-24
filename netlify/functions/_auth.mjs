// netlify/functions/_auth.mjs

function parseAdmins() {
  const raw =
    (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "lucaslopessd@gmail.com")
      .toLowerCase();
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

export function getUser(context) {
  return context?.clientContext?.user || null;
}

export function isAdmin(user) {
  const email = (user?.email || user?.app_metadata?.email || "").toLowerCase();
  const roles = Array.isArray(user?.app_metadata?.roles) ? user.app_metadata.roles : [];
  const admins = parseAdmins();
  return admins.includes(email) || roles.includes("admin") || roles.includes("gestor") || roles.includes("gerente");
}

export function requireUser(context) {
  const user = getUser(context);
  if (!user) {
    return [
      null,
      new Response(JSON.stringify({ error: "not-authenticated" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    ];
  }
  return [user, null];
}

export function requireAdmin(context) {
  const [user, err] = requireUser(context);
  if (err) return [null, err];
  if (!isAdmin(user)) {
    return [
      null,
      new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    ];
  }
  return [user, null];
}
