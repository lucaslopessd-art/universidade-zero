(() => {
  const API = '/.netlify/functions'
  const grid = document.getElementById('grid')
  const btnLogin = document.getElementById('btnLogin')
  const btnLogout = document.getElementById('btnLogout')
  const btnDash = document.getElementById('btnDash')
  const who = document.getElementById('who')
  const q = document.getElementById('q')

  // Somente cosmético; segurança real no backend
  const ADMIN_EMAIL = 'lucaslopessd@gmail.com'

  // >>> Novos parâmetros de robustez
  const PROGRESS_THRESHOLD = 0.95   // 95% já conta como concluído
  const AUDIT_MS = 1000             // auditor global a cada 1s
  const PING_MS = 5000              // envio de progresso p/ backend

  let catalog = []
  const videoById = new Map()       // id -> {id, title}
  const players = {}                // id -> { player, interval, playing, finishedOnce }
  let ytReady = false

  // ------------ UI / Login ------------
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
    try { netlifyIdentity.init({ APIUrl: window.IDENTITY_URL || `${location.origin}/.netlify/identity` }) } catch(e){}
    netlifyIdentity.on('init', ensureLoginUI)
    netlifyIdentity.on('login', ensureLoginUI)
    netlifyIdentity.on('logout', ensureLoginUI)
  }

  // ------------ Catálogo ------------
  function cardHtml(v){
    return `<div class="card" data-title="${(v.title||'').toLowerCase()}">
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

  q && q.addEventListener('input', () => {
    const term = q.value.toLowerCase()
    for(const el of grid.children){
      const t = el.getAttribute('data-title') || ''
      el.style.display = t.includes(term) ? '' : 'none'
    }
  })

  // ------------ YouTube Iframe API ------------
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
        } catch { /* tenta depois */ }
      }
    })
  }

  // ------------ Tracking + conclusão ------------
  async function ping(videoId, seconds){
    try{
      const user = netlifyIdentity.currentUser()
      if(!user) return
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
      const user = netlifyIdentity.currentUser()
      if(!user) return
      const token = await user.jwt()
      await fetch(API + '/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+token },
        body: JSON.stringify({ videoId, title })
      })
    }catch{}
  }

  function showCongrats(v){
    const wrap = document.createElement('div')
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999'
    wrap.innerHTML = `
      <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:24px;text-align:center;max-width:420px">
        <div style="font-size:44px;line-height:1">🏆</div>
        <h3 style="margin:8px 0 4px">Parabéns!</h3>
        <p style="margin:0 0 12px;color:#94a3b8">Concluiu: <b>${v.title || v.id}</b></p>
        <button id="ok" style="background:#1f2937;border:1px solid #374151;color:#e5e7eb;padding:10px 14px;border-radius:12px;cursor:pointer">Fechar</button>
      </div>
    `;
    document.body.appendChild(wrap)
    wrap.querySelector('#ok').onclick = () => document.body.removeChild(wrap)
    setTimeout(()=>{ if(document.body.contains(wrap)) document.body.removeChild(wrap) }, 7000)
  }

  function checkNearEnd(v, rec){
    if (!rec || !rec.player || rec.finishedOnce) return
    try{
      const cur = Math.max(0, rec.player.getCurrentTime?.() || 0)
      const dur = Math.max(1, rec.player.getDuration?.() || 1)
      if (dur > 0 && cur / dur >= PROGRESS_THRESHOLD) {
        rec.finishedOnce = true
        showCongrats(v)
        complete(v.id, v.title)
      }
    }catch{}
  }

  function onStateChange(v, e){
    const s = e.data
    const rec = players[v.id]
    if(!rec) return

    if(s === YT.PlayerState.PLAYING && !rec.playing){
      rec.playing = true
      rec.interval = setInterval(() => {
        ping(v.id, Math.round(PING_MS/1000))
        checkNearEnd(v, rec)            // checa durante a reprodução
      }, PING_MS)
    }else if((s === YT.PlayerState.PAUSED || s === YT.PlayerState.ENDED) && rec.playing){
      rec.playing = false
      if(rec.interval){ clearInterval(rec.interval); rec.interval = null }
      ping(v.id, 1)
    }

    // Redundância: quando o ENDED vier, garante
    if (s === YT.PlayerState.ENDED) checkNearEnd(v, rec)
  }

  // >>> Auditor global 1s: detecta conclusão mesmo se a pessoa só arrastar pro fim
  setInterval(() => {
    for (const id in players) {
      const rec = players[id]
      const v = videoById.get(id)
      if (!v) continue
      checkNearEnd(v, rec)
    }
  }, AUDIT_MS)

  // ------------ Catálogo ------------
  async function loadCatalog(){
    try{
      if(window.CATALOG_MODE === 'supabase'){
        const res = await fetch(API + '/catalog', { cache: 'no-store' })
        catalog = await res.json()
      }else{
        const res = await fetch('/videos.json', { cache: 'no-store' })
        catalog = await res.json()
      }
      videoById.clear()
      catalog.forEach(v => videoById.set(v.id, v))
      render()
    }catch(e){ console.error('Falha ao carregar catálogo', e) }
  }

  ensureLoginUI()
  loadCatalog()
})()
