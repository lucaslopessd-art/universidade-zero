(() => {
  const API = '/.netlify/functions'
  const grid = document.getElementById('grid')
  const btnLogin = document.getElementById('btnLogin')
  const btnLogout = document.getElementById('btnLogout')
  const who = document.getElementById('who')
  const q = document.getElementById('q')
  let catalog = []
  let players = {} // id -> {player, interval, playing}

  function ensureLoginUI(){
    const user = netlifyIdentity.currentUser && netlifyIdentity.currentUser()
    if(user){
      btnLogin.classList.add('hide')
      btnLogout.classList.remove('hide')
      grid.classList.remove('hide')
      who.textContent = user.email || ''
    }else{
      btnLogin.classList.remove('hide')
      btnLogout.classList.add('hide')
      grid.classList.add('hide')
      who.textContent = ''
    }
  }

  btnLogin.onclick = () => netlifyIdentity.open('login')
  btnLogout.onclick = () => netlifyIdentity.logout()
  if (window.netlifyIdentity) {
    try { window.netlifyIdentity.init({ APIUrl: window.IDENTITY_URL || `${location.origin}/.netlify/identity` }); } catch(e){}
    netlifyIdentity.on('init', ensureLoginUI)
    netlifyIdentity.on('login', ensureLoginUI)
    netlifyIdentity.on('logout', ensureLoginUI)
  }

  function cardHtml(v){
    return `<div class="card" data-title="${(v.title||'').toLowerCase()}">
      <div class="ratio"><iframe id="yt_${v.id}" loading="lazy"
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
  }

  q && q.addEventListener('input', () => {
    const term = q.value.toLowerCase()
    for(const el of grid.children){
      const t = el.getAttribute('data-title') || ''
      el.style.display = t.includes(term) ? '' : 'none'
    }
  })

  // YouTube API ready
  window.onYouTubeIframeAPIReady = () => {
    catalog.forEach(v => {
      const p = new YT.Player('yt_'+v.id, {
        events: {
          'onStateChange': (e) => onStateChange(v, e)
        }
      })
      players[v.id] = { player: p, interval: null, playing: false }
    })
  }

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
    }catch(err){ /* silent */ }
  }

  function onStateChange(v, e){
    const s = e.data
    const rec = players[v.id]
    if(!rec) return
    if(s === YT.PlayerState.PLAYING && !rec.playing){
      rec.playing = true
      rec.interval = setInterval(() => ping(v.id, 10), 10000)
    }else if((s === YT.PlayerState.PAUSED || s === YT.PlayerState.ENDED) && rec.playing){
      rec.playing = false
      if(rec.interval){ clearInterval(rec.interval); rec.interval = null }
      ping(v.id, 1)
    }
  }

  async function loadCatalog(){
    try{
      if(window.CATALOG_MODE === 'supabase'){
        const res = await fetch(API + '/catalog')
        catalog = await res.json()
      }else{
        const res = await fetch('/videos.json', { cache: 'no-store' })
        catalog = await res.json()
      }
      render()
    }catch(e){
      console.error('Falha ao carregar catálogo', e)
    }
  }

  ensureLoginUI()
  loadCatalog()
})()
