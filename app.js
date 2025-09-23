(() => {
  const API = '/.netlify/functions'
  const grid = document.getElementById('grid')
  const btnLogin = document.getElementById('btnLogin')
  const btnLogout = document.getElementById('btnLogout')
  const btnDash = document.getElementById('btnDash')
  const who = document.getElementById('who')
  const q = document.getElementById('q')

  const ADMIN_EMAIL = (window.ADMIN_EMAIL || 'lucaslopessd@gmail.com')
  const PROGRESS_THRESHOLD = 0.95
  const AUDIT_MS = 1000
  const PING_MS = 5000

  let catalog = []
  const videoById = new Map()
  const players = {}
  let ytReady = false

  // --- util ---
  const norm = s => (s || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim()

  // --- identity hardening/in-app hint ---
  ;(function(){
    const ua = navigator.userAgent || ''
    const inApp = /(FBAN|FBAV|Instagram|WhatsApp|Line|Messenger|Snapchat|Twitter)/i.test(ua)
    if (inApp) { const b = document.getElementById('inapp'); if (b) b.style.display = 'block' }
    if (window.netlifyIdentity) {
      try { window.netlifyIdentity.init({ APIUrl: window.IDENTITY_URL || `${location.origin}/.netlify/identity` }) } catch(e){}
    }
  })()

  // --- login/ui ---
  function ensureLoginUI(){
    const user = netlifyIdentity.currentUser && netlifyIdentity.currentUser()
    const logged = !!user
    btnLogin.classList.toggle('hide', logged)
    btnLogout.classList.toggle('hide', !logged)
    grid.classList.toggle('hide', !logged)
    who.textContent = logged ? (user.email || '') : ''
    const isAdmin = logged && (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()
    btnDash && btnDash.classList.toggle('hide', !isAdmin)
  }
  btnLogin.onclick = () => netlifyIdentity.open('login')
  btnLogout.onclick = () => netlifyIdentity.logout()
  if (window.netlifyIdentity) {
    netlifyIdentity.on('init', ensureLoginUI)
    netlifyIdentity.on('login', ensureLoginUI)
    netlifyIdentity.on('logout', ensureLoginUI)
  }

  // --- render ---
  function cardHtml(v){
    const keys = norm(`${v.title||''} ${v.id||''}`)
    return `<div class="card" data-keys="${keys}">
      <div class="ratio"><iframe id="yt_${v.id}"
        src="https://www.youtube-nocookie.com/embed/${v.id}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1"
        title="${v.title||v.id}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
      <div class="title">${v.title||v.id}</div>
      <div class="muted"><a href="https://youtu.be/${v.id}" target="_blank" rel="noreferrer">Abrir no YouTube</a></div>
    </div>`
  }
  function render(){
    grid.innerHTML = catalog.map(cardHtml).join('')
    ensurePlayers()
  }

  // --- busca robusta ---
  function applyFilter(){
    const term = norm(q?.value || '')
    if (!term) { for (const el of grid.children) el.style.display = ''; return }
    for (const el of grid.children){
      const keys = el.getAttribute('data-keys') || ''
      el.style.display = keys.includes(term) ? '' : 'none'
    }
  }
  q && ['input','keyup','change'].forEach(ev => q.addEventListener(ev, applyFilter))

  // --- YT API ---
  window.onYouTubeIframeAPIReady = () => { ytReady = true; ensurePlayers() }
  function ensurePlayers(){
    if(!ytReady || !window.YT || !YT.Player){ setTimeout(ensurePlayers, 250); return }
    catalog.forEach(v => {
      if (!players[v.id]) {
        const elId = 'yt_' + v.id
        const el = document.getElementById(elId)
        if (!el) return
        try {
          const player = new YT.Player(elId, { events: { onStateChange: (e) => onStateChange(v, e) }})
          players[v.id] = { player, interval: null, playing: false, finishedOnce: false }
        } catch {}
      }
    })
  }

  // --- tracking + gamificação ---
  async function ping(videoId, seconds){
    try{
      const user = netlifyIdentity.currentUser(); if(!user) return
      const token = await user.jwt()
      await fetch(API + '/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+token },
        body: JSON.stringify({ videoId, seconds })
      })
    }catch{}
  }
  async function complete(videoId, title){
    try{
      const user = netlifyIdentity.currentUser(); if(!user) return
      const token = await user.jwt()
      await fetch(API + '/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+token },
        body: JSON.stringify({ videoId, title
