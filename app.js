(function () {
  const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
  }

  function platformGroup(p) {
    return p === 'pc' ? 'pc' : 'mobile';
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function highlight(title, query) {
    if (!query) return escapeHtml(title);
    const idx = title.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escapeHtml(title);
    const before = title.slice(0, idx);
    const match = title.slice(idx, idx + query.length);
    const after = title.slice(idx + query.length);
    return `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
  }

  const state = {
    query: '',
    platform: 'all',
    sort: 'recent',
    visible: 60,
  };

  const PAGE_SIZE = 60;

  const grid = document.getElementById('ticket-grid');
  const notFound = document.getElementById('not-found');
  const loadMoreBtn = document.getElementById('load-more');
  const resultsCount = document.getElementById('results-count');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const chips = document.querySelectorAll('.chip');

  function initStats() {
    const totalTitles = GAMES_DATA.length;
    const totalClaims = GAMES_DATA.reduce((sum, g) => sum + g.timesFree, 0);
    const earliest = GAMES_DATA.reduce((min, g) => (g.firstDate < min ? g.firstDate : min), GAMES_DATA[0].firstDate);
    document.getElementById('stat-total').textContent = totalTitles.toLocaleString('pt-BR');
    document.getElementById('stat-claims').textContent = totalClaims.toLocaleString('pt-BR');
    document.getElementById('stat-since').textContent = earliest.slice(0, 4);
  }

  function getFiltered() {
    let list = GAMES_DATA;

    if (state.platform !== 'all') {
      list = list.filter((g) => g.claims.some((c) => platformGroup(c.platform) === state.platform));
    }

    if (state.query) {
      const q = state.query.toLowerCase();
      list = list.filter((g) => g.title.toLowerCase().includes(q));
    }

    list = list.slice().sort((a, b) => {
      switch (state.sort) {
        case 'oldest': return a.firstDate.localeCompare(b.firstDate);
        case 'az': return a.title.localeCompare(b.title, 'pt-BR');
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'recent':
        default: return b.lastDate.localeCompare(a.lastDate);
      }
    });

    return list;
  }

  function ticketHTML(game) {
    const platforms = new Set(game.claims.map((c) => platformGroup(c.platform)));
    const badge = platforms.size > 1 ? 'PC + Mobile' : (platforms.has('pc') ? 'PC' : 'Mobile');

    const datesToShow = game.claims.slice(-3).reverse();
    const extra = game.claims.length - datesToShow.length;

    const datesHTML = datesToShow.map((c) => `
      <div class="date-row"><span class="dot"></span>${formatDate(c.date)}${platforms.size > 1 ? ` · ${platformGroup(c.platform) === 'pc' ? 'PC' : 'Mobile'}` : ''}</div>
    `).join('') + (extra > 0 ? `<div class="date-row"><span class="dot"></span>+ ${extra} vez${extra > 1 ? 'es' : ''} antes</div>` : '');

    const ratingText = game.rating ? `<span><b>${game.rating.toFixed(2)}</b> nota Epic</span>` : '';
    const metaText = game.metacritic ? `<span><b>${game.metacritic}</b> Metacritic</span>` : '';

    return `
      <article class="ticket">
        <div class="ticket-top">
          <h3 class="ticket-title">${highlight(game.title, state.query)}</h3>
          <span class="platform-badge">${badge}</span>
        </div>
        <div class="ticket-meta">${ratingText}${metaText}</div>
        <div class="ticket-perf"></div>
        <div class="ticket-dates">${datesHTML}</div>
        <div class="ticket-footer">
          <span class="ticket-stamp">${game.timesFree > 1 ? game.timesFree + 'x grátis' : 'grátis'}</span>
          ${game.storeLink ? `<a class="ticket-link" href="${game.storeLink}" target="_blank" rel="noopener">ver na loja ↗</a>` : ''}
        </div>
      </article>
    `;
  }

  function render() {
    const filtered = getFiltered();

    if (state.query && filtered.length === 0) {
      notFound.classList.remove('hidden');
      grid.classList.add('hidden');
      loadMoreBtn.classList.add('hidden');
      resultsCount.textContent = `Nenhum resultado para "${state.query}"`;
      return;
    }

    notFound.classList.add('hidden');
    grid.classList.remove('hidden');

    const toShow = filtered.slice(0, state.visible);
    grid.innerHTML = toShow.map(ticketHTML).join('');

    if (filtered.length > state.visible) {
      loadMoreBtn.classList.remove('hidden');
    } else {
      loadMoreBtn.classList.add('hidden');
    }

    if (state.query) {
      resultsCount.textContent = `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} para "${state.query}"`;
    } else {
      resultsCount.textContent = `${filtered.length.toLocaleString('pt-BR')} jogos no arquivo`;
    }
  }

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.query = e.target.value.trim();
      state.visible = PAGE_SIZE;
      render();
    }, 120);
  });

  sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    state.visible = PAGE_SIZE;
    render();
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      state.platform = chip.dataset.platform;
      state.visible = PAGE_SIZE;
      render();
    });
  });

  loadMoreBtn.addEventListener('click', () => {
    state.visible += PAGE_SIZE;
    render();
  });

  initStats();
  render();
})();
