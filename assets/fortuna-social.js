(() => {
  const STORAGE_KEY = 'fortuna.profile.v1';
  const FAVOR_LEDGER_KEY = 'fortuna.favor.ledger.v1';
  const SITE_SETTINGS_KEY = 'fortuna.site.settings.v1';

  const defaults = {
    displayName: 'BLOO',
    fortuneId: '17•421',
    status: 'should be sleeping',
    bio: 'oh hey whats goin on man?\n\nmakes things. forgets lunch. likes machinery with questionable intentions.',
    favor: 284,
    pageColor: '#e7e0d4',
    linkColor: '#315b88',
    accentColor: '#bc6b87',
    avatarUrl: '',
    currentSong: 'The Heat Is On — Aaron G. West',
    embed1: '',
    embed2: '',
    embed3: ''
  };

  const siteDefaults = {
    theme: 'light',
    motion: true,
    sysClock: true,
    showFavor: true,
    showSong: true
  };

  const safeParse = (value, fallback) => {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  };

  const load = () => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY), {});
    return Object.assign({}, defaults, saved);
  };

  const save = (next) => {
    const merged = Object.assign({}, defaults, next || {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    apply(merged);
    window.dispatchEvent(new CustomEvent('fortuna-profile-updated', { detail: merged }));
    return merged;
  };

  const apply = (profile = load()) => {
    document.documentElement.style.setProperty('--page', profile.pageColor || defaults.pageColor);
    document.documentElement.style.setProperty('--link', profile.linkColor || defaults.linkColor);
    document.documentElement.style.setProperty('--rose', profile.accentColor || defaults.accentColor);

    document.querySelectorAll('[data-profile-name]').forEach(el => el.textContent = profile.displayName);
    document.querySelectorAll('[data-profile-id]').forEach(el => el.textContent = profile.fortuneId);
    document.querySelectorAll('[data-profile-favor]').forEach(el => el.textContent = String(profile.favor));
    document.querySelectorAll('[data-profile-status]').forEach(el => el.textContent = profile.status);
    document.querySelectorAll('[data-profile-song]').forEach(el => el.textContent = profile.currentSong);

    const bio = document.querySelector('[data-profile-bio]');
    if (bio) bio.textContent = profile.bio;

    const avatar = document.querySelector('[data-profile-avatar]');
    if (avatar) {
      avatar.innerHTML = '';
      if (profile.avatarUrl) {
        const img = document.createElement('img');
        img.src = profile.avatarUrl;
        img.alt = profile.displayName + ' avatar';
        img.loading = 'lazy';
        avatar.appendChild(img);
      } else {
        avatar.textContent = (profile.displayName || 'F').slice(0, 1).toUpperCase() + '.';
      }
    }
  };

  const bumpFavorOnce = (ledgerId, amount) => {
    const ledger = safeParse(localStorage.getItem(FAVOR_LEDGER_KEY), {});
    if (ledger[ledgerId]) return load();

    ledger[ledgerId] = true;
    localStorage.setItem(FAVOR_LEDGER_KEY, JSON.stringify(ledger));

    const p = load();
    p.favor = (Number(p.favor) || 0) + amount;
    return save(p);
  };

  const parseEmbed = (raw) => {
    const text = String(raw || '').trim();
    if (!text) return null;

    let url;
    try {
      url = new URL(text);
    } catch (_) {
      return { type: 'link', url: text, label: text };
    }

    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
      let id = '';
      if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
      else if (url.pathname.startsWith('/shorts/')) id = url.pathname.split('/')[2] || '';
      else id = url.searchParams.get('v') || '';
      if (id && /^[A-Za-z0-9_-]{6,20}$/.test(id)) {
        return { type: 'youtube', src: 'https://www.youtube-nocookie.com/embed/' + id };
      }
    }

    if (host === 'open.spotify.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && ['track','album','playlist','episode','show'].includes(parts[0])) {
        return { type: 'spotify', src: 'https://open.spotify.com/embed/' + parts[0] + '/' + encodeURIComponent(parts[1]) };
      }
    }

    if (/\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url.href)) {
      return { type: 'image', src: url.href };
    }

    return { type: 'link', url: url.href, label: host + url.pathname };
  };

  const renderEmbeds = (container, urls) => {
    if (!container) return;
    container.innerHTML = '';

    const entries = urls.map(parseEmbed).filter(Boolean);
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'embed-empty';
      empty.textContent = 'NO EMBEDS YET';
      container.appendChild(empty);
      return;
    }

    entries.forEach(entry => {
      const frame = document.createElement('div');
      frame.className = 'profile-embed';

      if (entry.type === 'youtube') {
        const iframe = document.createElement('iframe');
        iframe.src = entry.src;
        iframe.title = 'YouTube embed';
        iframe.loading = 'lazy';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;
        frame.appendChild(iframe);
      } else if (entry.type === 'spotify') {
        const iframe = document.createElement('iframe');
        iframe.src = entry.src;
        iframe.title = 'Spotify embed';
        iframe.loading = 'lazy';
        iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        frame.appendChild(iframe);
      } else if (entry.type === 'image') {
        const img = document.createElement('img');
        img.src = entry.src;
        img.alt = 'Profile embed';
        img.loading = 'lazy';
        frame.appendChild(img);
      } else {
        const a = document.createElement('a');
        a.href = entry.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = entry.label;
        frame.appendChild(a);
      }

      container.appendChild(frame);
    });
  };

  const loadSite = () => {
    const saved = safeParse(localStorage.getItem(SITE_SETTINGS_KEY), {});
    return Object.assign({}, siteDefaults, saved);
  };

  const getWrongTime = () => {
    const now = new Date();

    // Fortuna System Time is calibrated exactly 7h 17m 17s away from usefulness.
    const wrong = new Date(now.getTime() + ((7 * 60 * 60 + 17 * 60 + 17) * 1000));

    return [
      String(wrong.getHours()).padStart(2,'0'),
      String(wrong.getMinutes()).padStart(2,'0'),
      String(wrong.getSeconds()).padStart(2,'0')
    ].join(':');
  };

  let clockTimer = null;

  const applySite = (settings = loadSite()) => {
    document.documentElement.dataset.fortunaTheme = settings.theme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('fortuna-no-motion', !settings.motion);
    document.documentElement.classList.toggle('fortuna-hide-favor', !settings.showFavor);
    document.documentElement.classList.toggle('fortuna-hide-song', !settings.showSong);

    document.querySelectorAll('[data-sys-clock-wrap]').forEach(el => {
      el.hidden = !settings.sysClock;
    });

    const updateClock = () => {
      const value = getWrongTime();
      document.querySelectorAll('[data-sys-clock]').forEach(el => {
        el.textContent = value;
      });
    };

    updateClock();

    if (clockTimer) {
      window.clearInterval(clockTimer);
      clockTimer = null;
    }

    if (settings.sysClock) {
      clockTimer = window.setInterval(updateClock, 1000);
    }

    return settings;
  };

  const saveSite = next => {
    const merged = Object.assign({}, siteDefaults, next || {});
    localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(merged));
    applySite(merged);
    window.dispatchEvent(new CustomEvent('fortuna-site-settings-updated', { detail: merged }));
    return merged;
  };

  window.FortunaProfile = {
    defaults,
    load,
    save,
    apply,
    bumpFavorOnce,
    renderEmbeds
  };

  window.FortunaSite = {
    defaults: siteDefaults,
    load: loadSite,
    save: saveSite,
    apply: applySite,
    getWrongTime
  };

  apply();
  applySite();
})();