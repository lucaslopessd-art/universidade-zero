export function getIdentity(event){
  const cc = event.clientContext || {}
  const user = cc.user || null
  const roles = (user && user.app_metadata && user.app_metadata.roles) ? user.app_metadata.roles : []
  const sub = user ? user.sub : null
  const email = user ? (user.email || (user.user_metadata && user.user_metadata.email) || null) : null
  return { user, roles, sub, email }
}
export function requireAuth(event){
  const { user } = getIdentity(event)
  if(!user) throw new Error('Não autenticado. Ative Netlify Identity e login via Google.')
}
