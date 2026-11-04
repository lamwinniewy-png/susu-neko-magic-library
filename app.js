(() => {
  const BOOKS = window.BOOKS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- 儲存進度 ---------- */
  const KEY = 'magic-library-v1';
  let store = { stars: 0, learned: {}, games: {}, written: {}, voice: 'yue' };
  // progress kept in memory for this visit
  const save = () => {};
  const addStars = (n, msg) => { store.stars += n; save(); $('#starCount').textContent = store.stars; toast(msg || `得到 ${n} 粒星星！`); burstStars(); };
  $('#starCount').textContent = store.stars;

  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1900); };

  /* ---------- 朗讀（粵語 / 普通話） ---------- */
  let voices = [];
  const loadVoices = () => { voices = speechSynthesis ? speechSynthesis.getVoices() : []; };
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  const pickVoice = () => {
    const want = store.voice === 'yue' ? [/zh[-_]HK/i, /yue/i, /Cantonese/i] : [/zh[-_]CN/i, /zh[-_]TW/i, /Mandarin/i, /^zh/i];
    for (const re of want) { const v = voices.find(v => re.test(v.lang) || re.test(v.name)); if (v) return v; }
    return null;
  };
  // 朗讀：優先播放預先錄製的小朋友聲音，找不到才用瀏覽器語音
  let player = null;
  const stopSay = () => { if (player) { player.pause(); player = null; } try { speechSynthesis.cancel(); } catch (e) {} };
  const say = (text, rate = 0.85) => {
    const key = text.replace(/[【】〖〗]/g, '').trim();
    stopSay();
    // 粵語用裝置內置的香港廣東話語音；普通話用預錄的小朋友聲音
    const f = store.voice === 'cmn' ? window.AUDIO?.cmn?.[key] : null;
    if (f) { player = new Audio(`assets/audio/${store.voice}/${f}.mp3`); player.play().catch(() => {}); return; }
    if (!('speechSynthesis' in window)) { toast('這個瀏覽器未能朗讀，請大人幫忙讀一讀'); return; }
    const u = new SpeechSynthesisUtterance(key);
    const v = pickVoice(); if (v) u.voice = v;
    u.lang = store.voice === 'yue' ? 'zh-HK' : 'zh-CN';
    u.rate = rate; u.pitch = 1.1;
    speechSynthesis.speak(u);
  };
  const vBtn = $('#btnVoice');
  const syncVoiceBtn = () => vBtn.textContent = store.voice === 'yue' ? '讀音：粵語' : '讀音：普通話';
  syncVoiceBtn();
  vBtn.onclick = () => { store.voice = store.voice === 'yue' ? 'cmn' : 'yue'; save(); syncVoiceBtn(); say(store.voice === 'yue' ? '你好，我哋一齊讀書' : '你好，我們一起讀書'); };

  /* ---------- 魔法閃光 ---------- */
  const cv = $('#sparkles'), cx = cv.getContext('2d');
  let W, H, motes = [], bursts = [];
  const resize = () => { W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio; };
  resize(); addEventListener('resize', resize);
  for (let i = 0; i < 46; i++) motes.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + .6, s: Math.random() * .0004 + .0001, p: Math.random() * 6.28 });
  const burstStars = (x = innerWidth / 2, y = innerHeight / 2) => { for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, sp = Math.random() * 6 + 2; bursts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 1 }); } };
  const star = (x, y, r) => { cx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r, a = i * Math.PI / 5 - Math.PI / 2; cx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } cx.closePath(); cx.fill(); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function tick(t) {
    cx.clearRect(0, 0, W, H);
    const d = devicePixelRatio;
    for (const m of motes) {
      m.y -= m.s; if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
      const a = .35 + .35 * Math.sin(t / 900 + m.p);
      cx.fillStyle = `rgba(255,222,150,${a})`; cx.beginPath(); cx.arc((m.x + Math.sin(t / 3000 + m.p) * .01) * W, m.y * H, m.r * d, 0, 6.28); cx.fill();
    }
    bursts = bursts.filter(b => b.life > 0);
    for (const b of bursts) { b.x += b.vx; b.y += b.vy; b.vy += .18; b.life -= .02; cx.fillStyle = `rgba(255,210,100,${b.life})`; star(b.x * d, b.y * d, 7 * d * b.life + 2); }
    if (!reduce) requestAnimationFrame(tick);
  })(0);

  /* ---------- 書櫃 ---------- */
  const EMB = {
    leaf: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M20 3C9 3 4 9 4 15c0 2 .6 3.6 1.6 5L4 21.6 5.4 23l1.7-1.7C8.4 22 10 22.5 12 22.5 18 22.5 21 15 20 3zM7 19c2-5 5-8 10-11-4 4-6.5 7-8.5 12z"/></svg>',
    shell: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M12 3C6 3 2 8 2 13c0 1 1 2 2 2l3 5h10l3-5c1 0 2-1 2-2 0-5-4-10-10-10zm-1 15-2-9h2zm2 0V9h2zm-5-1-3-5 3-1zm8 0V11l3 1z"/></svg>',
    moon: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M14.5 2A10 10 0 1 0 22 15.5 8 8 0 0 1 14.5 2z"/></svg>',
    umbrella: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M12 2C6.5 2 2 6 2 11h9v8a2 2 0 0 1-4 0H5a4 4 0 0 0 8 0v-8h9c0-5-4.5-9-10-9z"/></svg>',
    monster: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M12 3c-4.4 0-8 3.4-8 8v9l2.2-1.6L8.4 20l1.8-1.6L12 20l1.8-1.6 1.8 1.6 2.2-1.6L20 20v-9c0-4.6-3.6-8-8-8zM9 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM9 15h6l-3 2z"/></svg>',
    house: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3z"/></svg>',
    map: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M15 4 9 2 3 4v18l6-2 6 2 6-2V2zm0 15.8-6-2V4.2l6 2z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3a1.5 1.5 0 0 0-3 0v1.2A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M18 4V2H6v2H2v3a4 4 0 0 0 4 4h.4A6 6 0 0 0 11 14.9V18H7v3h10v-3h-4v-3.1a6 6 0 0 0 4.6-3.9h.4a4 4 0 0 0 4-4V4zM6 9a2 2 0 0 1-2-2V6h2zm14-2a2 2 0 0 1-2 2V6h2z"/></svg>',
    sprite: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><circle cx="12" cy="7" r="3.2"/><path d="M12 11c-2.5 0-4 1.8-4 4.5V21h8v-5.5c0-2.7-1.5-4.5-4-4.5zM7.5 11.5C4 9 2 10 2 13c2 0 4 .2 5.5-1.5zm9 0C20 9 22 10 22 13c-2 0-4 .2-5.5-1.5z"/></svg>',
    paw: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><ellipse cx="6" cy="10" rx="2.2" ry="2.8"/><ellipse cx="10" cy="6" rx="2.2" ry="2.8"/><ellipse cx="14" cy="6" rx="2.2" ry="2.8"/><ellipse cx="18" cy="10" rx="2.2" ry="2.8"/><path d="M12 11c-3 0-6 4-6 7 0 2 1.6 3 3.4 2.4 1.7-.6 3.5-.6 5.2 0C16.4 21 18 20 18 18c0-3-3-7-6-7z"/></svg>',
    bear: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-3 6.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zm6 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 15c1.4 0 2.4.8 2.4 1.8S13.4 18.6 12 18.6s-2.4-.8-2.4-1.8S10.6 15 12 15z"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 18h6v1.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 19.5z"/></svg>',
    drop: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M12 2s-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13z"/></svg>',
    book: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M2 5c3-1.5 6.5-1.5 9 .5V21c-2.5-2-6-2-9-.5zm20 0c-3-1.5-6.5-1.5-9 .5V21c2.5-2 6-2 9-.5z"/></svg>',
    crown: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5zm2 13h14v2H5z"/></svg>',
    star: '<svg viewBox="0 0 24 24" class="sp-emb" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/></svg>'
  };
  const heights = [262, 248, 270, 255, 266];
  const rowMagic = $('#rowMagic'), rowExam = $('#rowExam'), rowExam2 = $('#rowExam2');
  const spineFor = (b, i, k) => {
    const bt = document.createElement('button');
    bt.className = 'spine';
    bt.style.setProperty('--c', b.spine); bt.style.setProperty('--h', heights[k % heights.length] + 'px'); bt.style.setProperty('--d', (k * .7) + 's');
    bt.setAttribute('aria-label', `魔法書：${b.title}`);
    const done = Object.keys(store.games[b.id] || {}).length;
    bt.innerHTML = `${EMB[b.emblem]}<span class="sp-title">${b.title}</span>` + (done ? `<span class="sp-done">${'★'.repeat(Math.min(done, 4))}</span>` : (i === 0 && !Object.keys(store.learned).length ? '<span class="sp-new">先讀</span>' : ''));
    bt.onclick = () => pullBook(i, bt);
    bt.onmouseenter = () => setBubble(`《${b.title}》<br>${b.subtitle}`);
    return bt;
  };
  const renderShelf = () => {
    rowMagic.innerHTML = ''; rowExam.innerHTML = ''; rowExam2.innerHTML = '';
    let km = 0, ke = 0, kf = 0;
    rowExam.insertAdjacentHTML('beforeend', '<div class="exam-plaque"><b>11月12日</b>中文評估<br>課文</div>');
    rowExam2.insertAdjacentHTML('beforeend', '<div class="exam-plaque"><b>11月12日</b>語文練習<br>閱讀・模擬</div>');
    BOOKS.forEach((b, i) => {
      if (b.group === 'exam') rowExam.appendChild(spineFor(b, i, ke++));
      else if (b.group === 'exam2') rowExam2.appendChild(spineFor(b, i, kf++));
      else rowMagic.appendChild(spineFor(b, i, km++));
    });
    rowMagic.insertAdjacentHTML('beforeend','<span class="lean" style="--c:#6b2d3a"></span><span class="candle" aria-hidden="true"></span>');
    rowExam.insertAdjacentHTML('beforeend','<span class="lean" style="--c:#2c4a6b"></span><span class="orb" aria-hidden="true"></span>');
  };
  renderShelf();

  const setBubble = (h) => { const b = $('#bubble'); b.innerHTML = h; b.style.animation = 'none'; b.offsetHeight; b.style.animation = ''; };

  // 視差
  const lib = $('#library'), shelfWrap = $('#shelfWrap');
  lib.addEventListener('pointermove', e => {
    if (innerWidth < 820) return;
    const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
    shelfWrap.style.setProperty('--ry', (nx * 8) + 'deg');
    $('.lib-bg').style.setProperty('--px', (-nx * 18) + 'px'); $('.lib-bg').style.setProperty('--py', (-ny * 12) + 'px');
  });

  /* ---------- 打開書本 ---------- */
  let cur = null, spreadIdx = 0, busy = false;
  const stage = $('#stage'), book = $('#book');
  const total = () => cur.pages.length + 1; // 故事頁 + 挑戰頁

  const pullBook = (i, el) => {
    el.classList.add('pulling');
    setTimeout(() => { el.classList.remove('pulling'); openBook(i); }, 480);
  };

  const openBook = (i) => {
    cur = BOOKS[i]; spreadIdx = 0;
    document.documentElement.style.setProperty('--book-c', cur.color);
    document.documentElement.style.setProperty('--book-a', cur.accent);
    $('#stageTitle').textContent = `《${cur.title}》`;
    $('#coverFront').innerHTML = `
      <img class="cv-img" src="assets/img/${cur.pages[0].img}.webp" alt="">
      <div class="cv-title">${cur.title}</div>
      <div class="cv-sub">Susu 與 Neko 魔法繪本<br>${cur.subtitle}</div>
      <button class="cv-open" id="cvOpen">打開魔法書 ✦</button>`;
    book.classList.remove('open','enter'); $('#cover').classList.remove('gone'); void book.offsetWidth; book.classList.add('enter'); book.addEventListener('animationend', function f(e){ if(e.target===book){ book.classList.remove('enter'); book.removeEventListener('animationend', f);} });
    lib.classList.remove('is-active'); stage.classList.add('is-active'); stage.setAttribute('aria-hidden', 'false');
    renderSpread();
    $('#coverFront').onclick = openCover;
    setTimeout(() => $('#cvOpen')?.focus(), 900);
  };
  const openCover = () => {
    if (book.classList.contains('open')) return;
    book.classList.remove('enter'); book.classList.add('open');
    setTimeout(() => popNow(), 650);
    setTimeout(() => $('#cover').classList.add('gone'), 1150);
  };
  const closeBook = () => {
    stopSay();
    stage.classList.remove('is-active'); stage.setAttribute('aria-hidden', 'true'); lib.classList.add('is-active');
    renderShelf();
    setBubble(cur && Object.keys(store.games[cur.id] || {}).length ? '你好叻呀！<br>再揀另一本魔法書吧！' : '歡迎回來！<br>想看哪一本魔法書？');
  };
  $('#btnBack').onclick = closeBook;

  const markup = (text, words) => {
    let first = true;
    return text.replace(/【(.+?)】([，。！？、」：；]*)/g, (_, w, pu) => `<span class="nb"><button class="vw ${store.learned[w] ? 'learned' : ''}" data-w="${w}">${w}</button>${pu}</span>`).replace(/〖(.+?)〗/g, '<mark class="gm">$1</mark>');
  };

  const frontSVG = (c, a, id) => {
    // 前景紙雕（依每本書主題）
    const fill = `color-mix(in oklab, ${c} 75%, #000)`;
    const shapes = {
      forest: `<path d="M0 120 V70 Q20 30 40 60 Q55 20 75 55 Q95 10 115 50 Q130 30 150 60 Q170 15 195 52 Q215 25 235 58 Q255 20 275 55 Q295 35 315 60 Q340 18 360 55 Q380 30 400 60 V120Z" fill="${fill}"/><path d="M0 120 V92 Q50 70 100 90 T200 88 T300 92 T400 86 V120Z" fill="${c}"/>`,
      ocean: `<path d="M0 120 V78 Q25 60 50 78 T100 78 T150 78 T200 78 T250 78 T300 78 T350 78 T400 78 V120Z" fill="${c}"/><path d="M30 120 V60 q-8-20 4-34 M60 120V70q10-18-2-36 M340 120V58q12-16 0-34 M370 120V72q-10-18 2-30" stroke="${a}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M0 120 V96 Q50 84 100 96 T200 96 T300 96 T400 96 V120Z" fill="${fill}"/>`,
      moon: `<path d="M0 120 V80 Q100 50 200 70 Q300 90 400 64 V120Z" fill="${fill}"/><g fill="${a}"><circle cx="60" cy="40" r="10"/><rect x="57" y="50" width="6" height="22"/><circle cx="340" cy="36" r="12"/><rect x="337" y="48" width="6" height="22"/></g><path d="M0 120 V100 Q100 86 200 98 Q300 108 400 92 V120Z" fill="${c}"/>`,
      rain: `<path d="M0 120V60h30V40h26v20h20V30h34v44h18V50h30v26h24V36h40v40h20V54h28v24h30V44h36v34h24V58h40v62Z" fill="${fill}"/><path d="M0 120 V98 Q100 88 200 98 T400 96 V120Z" fill="${c}"/>`,
      sports: `<path d="M0 120V76 L20 60 40 76 60 60 80 76 100 60 120 76 140 60 160 76 180 60 200 76 220 60 240 76 260 60 280 76 300 60 320 76 340 60 360 76 380 60 400 76V120Z" fill="${a}"/><path d="M0 120 V90 Q200 70 400 90 V120Z" fill="${c}"/><path d="M0 104 Q200 88 400 104" stroke="#fff" stroke-width="3" stroke-dasharray="14 10" fill="none"/>`
    };
    return `<svg viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">${shapes[id]}</svg>`;
  };

  const pageHTML = (idx) => {
    if (idx < cur.pages.length) {
      const p = cur.pages[idx];
      const ws = [...p.text.matchAll(/【(.+?)】/g)].map(m => m[1]);
      return {
        left: `<div class="txt">
            <div class="pg-no">第 ${idx + 1} 頁 · 共 ${cur.pages.length} 頁</div>
            <p class="story">${markup(p.text)}</p>
            <div class="tapme">點一點 <i>黃色詞語</i>，看看它的意思</div>
            ${idx === 0 || /一邊|因為|首先|雖然|像/.test(p.text) ? `<div class="pattern"><b>句式小魔法：</b>「${cur.pattern.name}」${cur.pattern.tip}<br>例：${cur.pattern.example}</div>` : ''}
          </div>`,
        right: `<div class="pop">
            <div class="pop-card"><img src="assets/img/${p.img}.webp" alt="故事插圖：第 ${idx + 1} 頁" loading="eager"></div>
            <div class="pop-front">${frontSVG(cur.color, cur.accent, cur.id)}</div>
            <div class="pop-tags">${ws.map((w, k) => `<button class="tag vw-tag" data-w="${w}" style="animation-delay:${.9 + k * .15}s">${w}</button>`).join('')}</div>
          </div>`
      };
    }
    const all = Object.keys(cur.words);
    const g = store.games[cur.id] || {};
    const gb = (id, icon, t, d) => `<button class="game-btn ${g[id] ? 'done' : ''}" data-g="${id}"><span class="gi">${icon}</span><b>${t}</b><span>${d}</span></button>`;
    const extra = (cur.learn ? gb('learn', '📜', '魔法課堂', cur.kind === 'reading' ? '先讀一讀三篇文章' : '温習課文和知識重點') : '') +
      (cur.qs ? gb('quiz', '🏆', cur.kind === 'mock' ? '模擬評估' : cur.kind === 'reading' ? '閱讀挑戰' : cur.kind === 'grammar' ? '練習挑戰' : '課文挑戰', cur.kind === 'mock' ? '隨機 25 題，看看你學會了多少' : '做做評估模擬題') : '');
    const wordGames = all.length ? gb('match', '🧩', '詞語配對', '把詞語和意思配成一對') + gb('fill', '✏️', '句子填充', '選出正確的詞語') + gb('listen', '🫧', '聽音找詞', '聽一聽，戳破泡泡') + (cur.write && cur.write.length ? gb('write', '🖌️', '寫字練習', '跟着筆順寫一寫') : '') : '';
    const leftTop = all.length
      ? `<p>這本魔法書藏着 ${all.length} 個魔法詞語。點一點，温習一下吧！</p>
          <div class="wordwall">${all.map(w => `<button class="vw ${store.learned[w] ? 'learned' : ''}" data-w="${w}">${w}</button>`).join('')}</div>`
      : `<p>打開「魔法課堂」，看看這本書要學的重點：</p>
          <div class="learn-list">${(cur.learn || []).map((c, k) => `<button class="ll" data-card="${k}">${c[0].replace(/<[^>]+>.*?<\/[^>]+>/g, '')}</button>`).join('')}</div>`;
    return {
      left: `<div class="end">
          <h3>故事完了！</h3>
          ${cur.lesson ? `<div class="lesson-tag">評估範圍：${cur.lesson}</div>` : ''}
          ${leftTop}
          <div class="pattern"><b>${cur.kind === 'reading' || cur.kind === 'mock' ? '小貼士' : '句式小魔法'}：</b>「${cur.pattern.name}」${cur.pattern.tip}<br>例：${cur.pattern.example}</div>
        </div>`,
      right: `<div class="end">
          <h3>魔法挑戰</h3>
          <p>完成挑戰，就可以收集魔法星星！</p>
          <div class="games ${extra && wordGames ? 'six' : ''}">${extra}${wordGames}</div>
        </div>`
    };
  };

  const renderSpread = () => {
    const h = pageHTML(spreadIdx);
    $('#pageLeft').innerHTML = h.left; $('#pageRight').innerHTML = h.right;
    $('#spread').classList.toggle('is-end', spreadIdx === cur.pages.length);
    $('#dots').innerHTML = Array.from({ length: total() }, (_, i) => `<span class="${i === spreadIdx ? 'on' : ''}"></span>`).join('');
    $('#btnPrev').disabled = spreadIdx === 0; $('#btnNext').disabled = spreadIdx === total() - 1;
    $('#btnRead').style.visibility = spreadIdx < cur.pages.length ? '' : 'hidden';
    if (book.classList.contains('open')) popNow();
  };
  const popNow = () => { const pop = $('#pageRight .pop'); if (!pop) return; pop.classList.remove('popped'); void pop.offsetWidth; pop.classList.add('popped'); };

  const flip = (dir) => {
    if (busy || !cur) return;
    const n = spreadIdx + dir; if (n < 0 || n >= total()) return;
    if (!book.classList.contains('open')) { openCover(); return; }
    stopSay();
    const leaf = $('#leaf');
    if (innerWidth <= 700 || reduce) { spreadIdx = n; renderSpread(); return; }
    busy = true;
    const nh = pageHTML(n);
    const front = leaf.querySelector('.leaf-front'), back = leaf.querySelector('.leaf-back');
    leaf.className = 'leaf ' + (dir > 0 ? 'fwd' : 'back');
    if (dir > 0) {
      front.innerHTML = $('#pageRight').innerHTML; back.innerHTML = nh.left;
      $('#pageRight').innerHTML = nh.right;
    } else {
      front.innerHTML = $('#pageLeft').innerHTML; back.innerHTML = nh.right;
      $('#pageLeft').innerHTML = nh.left;
    }
    front.querySelector('.pop')?.classList.add('popped');
    leaf.style.display = 'block'; void leaf.offsetWidth; leaf.classList.add('go');
    setTimeout(() => { spreadIdx = n; leaf.style.display = 'none'; leaf.className = 'leaf'; renderSpread(); busy = false; }, 820);
  };
  $('#btnNext').onclick = () => flip(1);
  $('#btnPrev').onclick = () => flip(-1);
  addEventListener('keydown', e => {
    if (!stage.classList.contains('is-active') || !$('#wordModal').hidden || !$('#panel').hidden) return;
    if (e.key === 'ArrowRight') flip(1); if (e.key === 'ArrowLeft') flip(-1);
    if (e.key === 'Escape') closeBook();
  });
  // 手機滑動翻頁
  let sx = null;
  $('#bookScene').addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  $('#bookScene').addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) flip(dx < 0 ? 1 : -1); sx = null; });

  $('#btnRead').onclick = () => { if (cur && spreadIdx < cur.pages.length) say(cur.pages[spreadIdx].text, .8); };

  // 立體傾斜
  $('#pageRight').addEventListener('pointermove', e => {
    const card = $('#pageRight .popped .pop-card'); if (!card || innerWidth <= 700) return;
    const r = e.currentTarget.getBoundingClientRect(); const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    card.style.animation = 'none'; card.style.transform = `rotateX(${-4 - ny * 6}deg) rotateY(${nx * 8}deg)`;
  });

  /* ---------- 詞語卡 ---------- */
  const findWord = (w) => { for (const b of BOOKS) if (b.words && b.words[w]) return { b, d: b.words[w] }; };
  const sentOf = (w, b) => { const p = b.pages.find(p => p.text.includes(`【${w}】`)); return p ? p.text.replace(/【(.+?)】/g, (_, x) => x === w ? `<mark>${x}</mark>` : x) : ''; };
  let curWord = null;
  const openWord = (w) => {
    const f = findWord(w); if (!f) return; curWord = w;
    $('#wmWord').textContent = w; $('#wmMean').textContent = f.d.mean; $('#wmSent').innerHTML = sentOf(w, f.b);
    $('#wmJp').hidden = !f.d.jp; $('#wmJp').textContent = f.d.jp ? `粵拼：${f.d.jp}` : '';
    $('#wmTip').hidden = !f.d.tip; $('#wmTip').innerHTML = f.d.tip ? `<b>記字小貼士</b>${f.d.tip}` + (f.d.wrong ? `<span class="wm-wrong">不要寫成：<s>${f.d.wrong}</s></span>` : '') : '';
    $('#wordModal').hidden = false; say(w, .75);
    if (!store.learned[w]) { store.learned[w] = 1; save(); addStars(1, `學會「${w}」！得到 1 粒星星`); $$(`.vw[data-w="${w}"]`).forEach(e => e.classList.add('learned')); }
    setTimeout(() => $('#wmSay').focus(), 50);
  };
  $('#wmSay').onclick = () => say(curWord, .7);
  $('#wmWrite').onclick = () => { const f = findWord(curWord); $('#wordModal').hidden = true; if (f) { cur = cur || f.b; openGame('write', [...curWord]); } };
  document.addEventListener('click', e => {
    const v = e.target.closest('.vw, .vw-tag'); if (v && v.dataset.w) { openWord(v.dataset.w); return; }
    const g = e.target.closest('.game-btn'); if (g) { openGame(g.dataset.g); return; }
    const ll = e.target.closest('.ll'); if (ll) { openGame('learn', +ll.dataset.card); return; }
    if (e.target.matches('[data-close]') || e.target.classList.contains('modal')) { e.target.closest('.modal').hidden = true; if (hw) { hw = null; } if (!$('#stage').classList.contains('is-active')) return; if (spreadIdx === total() - 1) renderSpread(); }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal').forEach(m => m.hidden = true); });

  /* ---------- 遊戲 ---------- */
  const panel = $('#panel'), pBody = $('#panelBody');
  const finish = (gid, stars, msg) => {
    store.games[cur.id] = store.games[cur.id] || {};
    const first = !store.games[cur.id][gid];
    store.games[cur.id][gid] = 1; save();
    pBody.innerHTML = `<div class="win"><div class="stars">${'★'.repeat(stars)}</div><p>${msg}</p>
      <div class="wbtns" style="justify-content:center"><button class="pri" id="again">再玩一次</button><button data-close>返回魔法書</button></div></div>`;
    $('#again').onclick = () => openGame(gid);
    if (first) addStars(stars, `完成挑戰！得到 ${stars} 粒星星`); else burstStars();
  };
  const openGame = (gid, chars) => {
    panel.hidden = false;
    ({ match: gMatch, fill: gFill, listen: gListen, write: gWrite, learn: gLearn, quiz: gQuiz })[gid](chars);
  };

  function gMatch() {
    $('#panelTitle').textContent = '詞語配對';
    const ws = shuffle(Object.keys(cur.words)).slice(0, 5);
    let sel = null, done = 0, miss = 0;
    pBody.innerHTML = `<p class="sub">先點一個<b>詞語</b>，再點它的<b>意思</b>。</p>
      <div class="match"><div class="col" id="cw">${shuffle(ws).map(w => `<button class="mi w" data-k="${w}">${w}</button>`).join('')}</div>
      <div class="col" id="cm">${shuffle(ws).map(w => `<button class="mi m" data-k="${w}">${cur.words[w].mean}</button>`).join('')}</div></div>`;
    pBody.onclick = e => {
      const b = e.target.closest('.mi'); if (!b || b.classList.contains('ok')) return;
      if (b.classList.contains('w')) { $$('.mi.w', pBody).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = b; say(b.dataset.k); return; }
      if (!sel) { toast('先點左邊的詞語'); return; }
      if (sel.dataset.k === b.dataset.k) { sel.classList.add('ok'); b.classList.add('ok'); sel.classList.remove('sel'); sel = null; done++; const r = b.getBoundingClientRect(); burstStars(r.left + r.width / 2, r.top); if (done === ws.length) { pBody.onclick = null; setTimeout(() => finish('match', miss < 2 ? 3 : 2, miss < 2 ? '全部配對成功！你真是詞語小魔法師！' : '配對成功！多練習會更厲害！'), 600); } }
      else { miss++; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); }
    };
  }

  const CONFUSE = [['努力','堅持'],['害怕','擔心'],['認真','耐心'],['明亮','漂亮'],['響亮','熱烈'],['果然','忽然','終於'],['驚喜','禮物'],['首先','然後','最後'],['幫忙','合作'],['開始','幫忙'],['激動','神氣'],['擔心','激動'],['表揚','批評'],['旅遊','尋找']];
  function gFill() {
    $('#panelTitle').textContent = '句子填充';
    const all = Object.keys(cur.words), qs = shuffle(all).slice(0, 5);
    let i = 0, right = 0;
    const show = () => {
      const w = qs[i]; const bad = new Set(CONFUSE.filter(g => g.includes(w)).flat());
      const ops = [w, ...shuffle(all.filter(x => x !== w && !bad.has(x))).slice(0, 2)];
      pBody.innerHTML = `<div class="progress"><i style="width:${i / qs.length * 100}%"></i></div>
        <p class="sub">第 ${i + 1} 題 / 共 ${qs.length} 題 · 選出最合適的詞語</p>
        <p class="q">${cur.words[w].fill.replace('＿＿', '<span class="blank">　</span>')}</p>
        <div class="opts">${shuffle(ops).map(o => `<button class="opt" data-o="${o}">${o}</button>`).join('')}</div>`;
      let tried = false;
      pBody.onclick = e => {
        const b = e.target.closest('.opt'); if (!b) return;
        if (b.dataset.o === w) {
          b.classList.add('ok'); $('.blank', pBody).textContent = w; if (!tried) right++;
          say(cur.words[w].fill.replace('＿＿', w));
          pBody.onclick = null; setTimeout(() => { i++; i < qs.length ? show() : finish('fill', right >= 4 ? 3 : right >= 2 ? 2 : 1, `答對 ${right} / ${qs.length} 題！`); }, 1400);
        } else { tried = true; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); }
      };
    };
    show();
  }

  function gListen() {
    $('#panelTitle').textContent = '聽音找詞';
    const all = Object.keys(cur.words), qs = shuffle(all).slice(0, 5);
    let i = 0, right = 0;
    const show = () => {
      const w = qs[i]; const ops = shuffle([w, ...shuffle(all.filter(x => x !== w)).slice(0, 5)]);
      pBody.innerHTML = `<div class="progress"><i style="width:${i / qs.length * 100}%"></i></div>
        <p class="sub">第 ${i + 1} 題 / 共 ${qs.length} 題 · 聽聽 Susu 讀的是哪個詞語？戳破正確的泡泡！</p>
        <div class="listen"><button class="big-say" id="sayQ">🔊 再聽一次</button></div>
        <div class="bubbles">${ops.map((o, k) => `<button class="bb" data-o="${o}" style="--d:${k * .3}s">${o}</button>`).join('')}</div>
        <p class="note">提示：聽不到聲音？請開啟裝置音量，或請大人讀出提示：「${cur.words[w].mean}」</p>`;
      $('#sayQ').onclick = () => say(w, .7); setTimeout(() => say(w, .7), 350);
      let tried = false;
      pBody.onclick = e => {
        const b = e.target.closest('.bb'); if (!b) return;
        if (b.dataset.o === w) { b.classList.add('ok'); if (!tried) right++; const r = b.getBoundingClientRect(); burstStars(r.left + r.width / 2, r.top + r.height / 2); pBody.onclick = null; setTimeout(() => { i++; i < qs.length ? show() : finish('listen', right >= 4 ? 3 : right >= 2 ? 2 : 1, `找對 ${right} / ${qs.length} 個詞語！`); }, 800); }
        else { tried = true; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); say(b.dataset.o); }
      };
    };
    show();
  }

  let hw = null;
  function gWrite(chars) {
    $('#panelTitle').textContent = '寫字練習';
    const list = chars && chars.length ? chars : cur.write;
    let idx = 0;
    pBody.onclick = null;
    pBody.innerHTML = `<p class="sub">先看示範，再用手指或滑鼠，按筆順在田字格內寫一寫。</p>
      <div class="write-wrap">
        <div class="grid-box">
          <svg class="tz" viewBox="0 0 100 100" aria-hidden="true"><line x1="0" y1="50" x2="100" y2="50" stroke="#e8a3a3" stroke-dasharray="3 3"/><line x1="50" y1="0" x2="50" y2="100" stroke="#e8a3a3" stroke-dasharray="3 3"/><line x1="0" y1="0" x2="100" y2="100" stroke="#f3d0d0" stroke-dasharray="2 4"/><line x1="100" y1="0" x2="0" y2="100" stroke="#f3d0d0" stroke-dasharray="2 4"/></svg>
          <div id="hw"></div>
        </div>
        <div>
          <div class="char-pick" id="cpick">${list.map((c, k) => `<button class="cp ${k === 0 ? 'on' : ''} ${store.written[c] ? 'done' : ''}" data-k="${k}">${c}</button>`).join('')}</div>
          <div class="wbtns"><button class="pri" id="wDemo">看示範</button><button id="wQuiz">我來寫</button><button id="wSay">讀一讀</button></div>
          <div class="wmsg" id="wmsg"></div>
          <p class="note">筆順動畫資料只供參考。香港學校以教育局《常用字字形表》及《香港小學學習字詞表》的字形和筆順為準。</p>
        </div>
      </div>`;
    const size = Math.min(300, innerWidth * .7);
    const loader = (c, onLoad, onErr) => fetch(`assets/hanzi/${c.codePointAt(0).toString(16)}.json`).then(r => r.ok ? r.json() : fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(c)}.json`).then(r => r.json())).then(onLoad).catch(onErr);
    const make = () => {
      $('#hw').innerHTML = ''; const c = list[idx];
      hw = HanziWriter.create('hw', c, { width: size, height: size, padding: 18, strokeColor: '#2a1d14', radicalColor: cur.color, outlineColor: '#e9dcc4', drawingColor: '#c0392b', drawingWidth: 22, showCharacter: false, showOutline: true, strokeAnimationSpeed: 1, delayBetweenStrokes: 220, charDataLoader: loader, onLoadCharDataError: () => { $('#wmsg').textContent = '暫時未能載入這個字的筆順。'; } });
      $('#wmsg').textContent = `「${c}」`;
      quiz();
    };
    const quiz = () => {
      const c = list[idx]; let mistakes = 0;
      hw.quiz({ leniency: 1.3, showHintAfterMisses: 2,
        onMistake: () => { mistakes++; },
        onCorrectStroke: s => { $('#wmsg').textContent = `「${c}」第 ${s.strokeNum + 1} 筆 / 共 ${s.strokeNum + 1 + s.strokesRemaining} 筆 ✓`; },
        onComplete: () => {
          $('#wmsg').textContent = mistakes < 3 ? `寫得好！「${c}」完成了！` : `完成了！再寫一次會更好！`; say(c);
          const r = $('#hw').getBoundingClientRect(); burstStars(r.left + r.width / 2, r.top + r.height / 2);
          if (!store.written[c]) { store.written[c] = 1; save(); $(`.cp[data-k="${idx}"]`)?.classList.add('done'); }
          if (list.every(x => store.written[x]) && !chars) { store.games[cur.id] = store.games[cur.id] || {}; if (!store.games[cur.id].write) { store.games[cur.id].write = 1; save(); addStars(3, '寫字練習全部完成！得到 3 粒星星'); } }
        } });
    };
    $('#cpick').onclick = e => { const b = e.target.closest('.cp'); if (!b) return; $$('.cp').forEach(x => x.classList.remove('on')); b.classList.add('on'); idx = +b.dataset.k; make(); say(list[idx]); };
    $('#wDemo').onclick = () => { hw.cancelQuiz(); hw.showOutline(); hw.animateCharacter({ onComplete: () => { $('#wmsg').textContent = '到你寫了！'; setTimeout(quiz, 500); } }); };
    $('#wQuiz').onclick = () => { hw.cancelQuiz(); hw.hideCharacter(); quiz(); };
    $('#wSay').onclick = () => say(list[idx]);
    make();
  }


  /* ---------- 魔法課堂 ---------- */
  function gLearn(start) {
    const cards = cur.learn || []; let k = typeof start === 'number' ? start : 0;
    $('#panelTitle').textContent = '魔法課堂';
    const plain = h => h.replace(/<br>/g, '，').replace(/<\/p>/g, '。').replace(/<[^>]+>/g, '').replace(/。。/g, '。');
    const show = () => {
      const [t, h] = cards[k];
      pBody.innerHTML = `<div class="progress"><i style="width:${(k + 1) / cards.length * 100}%"></i></div>
        <p class="sub">第 ${k + 1} 張 / 共 ${cards.length} 張${cur.lesson ? ' · ' + cur.lesson : ''}</p>
        <div class="learn-card"><h4>${t}</h4><div class="lc-body">${h}</div></div>
        <div class="wbtns" style="justify-content:space-between">
          <button id="lPrev" ${k === 0 ? 'disabled' : ''}>‹ 上一張</button>
          <button id="lSay">讀一讀</button>
          ${k < cards.length - 1 ? '<button class="pri" id="lNext">下一張 ›</button>' : '<button class="pri" id="lDone">完成 ★</button>'}
        </div>`;
      pBody.scrollTop = 0;
    };
    pBody.onclick = e => {
      if (e.target.id === 'lPrev' && k > 0) { stopSay(); k--; show(); }
      else if (e.target.id === 'lNext') { stopSay(); k++; show(); }
      else if (e.target.id === 'lSay') say(plain(cards[k][1]), .8);
      else if (e.target.id === 'lDone') { stopSay(); pBody.onclick = null; finish('learn', 3, '魔法課堂完成了！記住這些重點，評估時就不怕了。'); }
    };
    show();
  }

  /* ---------- 評估挑戰 ---------- */
  const quizPool = () => {
    if (!cur.mockAll) return cur.qs;
    const others = BOOKS.filter(b => b.qs && b.kind !== 'reading' && b.kind !== 'mock').flatMap(b => b.qs);
    return [...shuffle(cur.qs).slice(0, 15), ...shuffle(others).slice(0, 10)];
  };
  function gQuiz() {
    $('#panelTitle').textContent = cur.kind === 'mock' ? '模擬評估' : '評估挑戰';
    const N = cur.kind === 'mock' ? 25 : 10;
    const qs = shuffle(quizPool()).slice(0, N);
    let i = 0, right = 0, wrongList = [];
    const show = () => {
      const q = qs[i]; let tried = false, picked = new Set();
      const pas = q.p !== undefined && cur.passages ? cur.passages[q.p] : null;
      let body = '';
      if (q.type === 'mc') body = `<div class="opts qopts">${shuffle([q.answer, ...q.wrong]).map(o => `<button class="opt qo" data-o="${encodeURIComponent(o)}">${o}</button>`).join('')}</div>`;
      else if (q.type === 'multi') body = `<div class="opts qopts">${shuffle([...q.answers, ...q.wrong]).map(o => `<button class="opt qo" data-o="${encodeURIComponent(o)}">${o}</button>`).join('')}</div><div class="wbtns" style="justify-content:center"><button class="pri" id="qCheck">對答案</button></div>`;
      else body = `<div class="ord-ans" id="ordAns"></div><div class="ord-tiles">${shuffle(q.tiles.map((t, k) => ({ t, k }))).map(o => `<button class="tile" data-k="${o.k}">${o.t}</button>`).join('')}</div><div class="wbtns" style="justify-content:center"><button id="qReset">重新排</button><button class="pri" id="qCheck">對答案</button></div>`;
      pBody.innerHTML = `<div class="progress"><i style="width:${i / qs.length * 100}%"></i></div>
        <p class="sub">第 ${i + 1} 題 / 共 ${qs.length} 題${q.type === 'multi' ? ' · 選出所有正確答案' : q.type === 'order' ? ' · 按次序點選詞語卡' : ''}</p>
        ${pas ? `<details class="passage"><summary>📖 看文章《${pas.title}》</summary>${pas.text.map(t => `<p>${t}</p>`).join('')}</details>` : ''}
        <p class="q qq">${q.text.replace(/＿＿＿＿|＿＿/, '<span class="blank">　</span>')}</p>
        ${body}<div class="explain" id="qEx" hidden></div>
        <div class="wbtns" style="justify-content:center"><button class="pri" id="qNext" hidden>${i < qs.length - 1 ? '下一題 ›' : '看結果'}</button></div>`;
      pBody.scrollTop = 0;
      let order = [];
      const done = ok => {
        if (ok && !tried) right++; else if (!ok) wrongList.push(q);
        const ex = $('#qEx'); ex.hidden = false;
        const ans = q.type === 'mc' ? q.answer : q.type === 'multi' ? q.answers.join('、') : q.answer;
        ex.innerHTML = `${ok ? (tried ? '答對了！' : '答對了，你真棒！') : '答案是：<b>' + ans + '</b>'}${q.explain ? '<br>' + q.explain : ''}`;
        ex.className = 'explain ' + (ok ? 'good' : 'oops');
        $$('.qo,.tile,#qCheck,#qReset', pBody).forEach(b => b.disabled = true);
        $('#qNext').hidden = false;
        if (ok) burstStars();
      };
      pBody.onclick = e => {
        const b = e.target.closest('button'); if (!b || b.disabled) return;
        if (b.id === 'qNext') { i++; i < qs.length ? show() : end(); return; }
        if (q.type === 'mc' && b.classList.contains('qo')) {
          const o = decodeURIComponent(b.dataset.o);
          if (o === q.answer) { b.classList.add('ok'); done(true); }
          else if (!tried) { tried = true; b.classList.add('bad'); }
          else { b.classList.add('bad'); $$('.qo', pBody).forEach(x => { if (decodeURIComponent(x.dataset.o) === q.answer) x.classList.add('ok'); }); done(false); }
        } else if (q.type === 'multi') {
          if (b.classList.contains('qo')) { const o = decodeURIComponent(b.dataset.o); picked.has(o) ? picked.delete(o) : picked.add(o); b.classList.toggle('sel'); }
          if (b.id === 'qCheck') {
            const ok = picked.size === q.answers.length && q.answers.every(a => picked.has(a));
            $$('.qo', pBody).forEach(x => { const o = decodeURIComponent(x.dataset.o); if (q.answers.includes(o)) x.classList.add('ok'); else if (picked.has(o)) x.classList.add('bad'); });
            done(ok);
          }
        } else if (q.type === 'order') {
          if (b.classList.contains('tile')) { order.push(+b.dataset.k); b.disabled = true; b.classList.add('used'); $('#ordAns').innerHTML = order.map(k => `<span>${q.tiles[k]}</span>`).join(''); }
          if (b.id === 'qReset') { order = []; $('#ordAns').innerHTML = ''; $$('.tile', pBody).forEach(x => { x.disabled = false; x.classList.remove('used'); }); }
          if (b.id === 'qCheck') { if (order.length < q.tiles.length) { setBubble('先把所有詞語卡排好啊！'); return; } done(order.map(k => q.tiles[k]).join('') === q.answer); }
        }
      };
    };
    const end = () => {
      const pct = right / qs.length;
      pBody.onclick = null;
      finish('quiz', pct >= .8 ? 3 : pct >= .5 ? 2 : 1, `答對 ${right} / ${qs.length} 題！` + (wrongList.length ? `<br><small>答錯的題目，可以再玩一次温習。每次題目都會不同。</small>` : '<br>全部答對，你是語文小魔法師！'));
    };
    show();
  }

  /* ---------- 詞語寶盒 / 星星 ---------- */
  const openBox = () => {
    panel.hidden = false; $('#panelTitle').textContent = '我的詞語寶盒';
    const n = Object.keys(store.learned).length, tot = BOOKS.reduce((s, b) => s + Object.keys(b.words).length, 0);
    pBody.onclick = null;
    pBody.innerHTML = `<p class="sub">已收集 <span class="score">★ ${n} / ${tot} 個詞語</span>　閱讀故事時點一點黃色詞語，就能把它放進寶盒。</p>` +
      BOOKS.filter(b => Object.keys(b.words).length).map(b => { const ws = Object.keys(b.words); const g = ws.filter(w => store.learned[w]).length;
        return `<div class="box-sec"><span>《${b.title}》</span><span>${g} / ${ws.length}</span></div><div class="box-grid">${ws.map(w => store.learned[w] ? `<button class="box-word got vw" style="--c:${b.color}" data-w="${w}">${w}</button>` : `<div class="box-word">？？</div>`).join('')}</div>`; }).join('') +
      `<p class="note">家長小貼士：所有詞語選自小學第一學習階段（小一至小三）常用詞語，配合教育局《香港小學學習字詞表》的學習範圍。進度只儲存在這部裝置。</p>`;
  };
  $('#btnBox').onclick = openBox;
  $('#btnStars').onclick = () => { setBubble(`你已經有 ${store.stars} 粒星星！<br>讀故事、玩遊戲可以拿更多！`); burstStars(); };

  // 圖書館問候
  const hellos = ['歡迎來到魔法圖書館！<br>從書櫃拿一本魔法書吧！', '我是 Susu！<br>紅色裙子的就是我！', '我是 Neko！<br>我們一起去冒險吧！'];
  let hi = 0; setInterval(() => { if (lib.classList.contains('is-active') && !lib.matches(':hover')) { hi = (hi + 1) % hellos.length; setBubble(hellos[hi]); } }, 7000);
})();
