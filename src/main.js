import './styles.css';
import { albumStructure } from './albumData.js';
import {
  applySectionOverrides,
  createEmptyCollection,
  getSectionProgress,
  getStats,
  loadCollection,
  normalizeCollection,
  saveCollection,
  toggleCard,
  toggleCocaCola,
  updateSectionOverrides,
} from './state.js';

const app = document.querySelector('#app');

let collection = loadCollection(albumStructure);
let view = 'home';
let countrySearch = '';
let selectedSectionId = applySectionOverrides(albumStructure, collection)[0]?.id;
let toastTimer;

const navItems = [
  ['home', 'Home', '⌂'],
  ['country', 'Secção', '▦'],
  ['coca', 'Coca-Cola', '●'],
  ['stats', 'Estatísticas', '◎'],
];

function persist(nextCollection, message) {
  collection = saveCollection(nextCollection);
  render();
  if (message) showToast(message);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  const toast = document.querySelector('[data-toast]');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 1800);
}

function setView(nextView, sectionId) {
  view = nextView;
  if (sectionId) selectedSectionId = sectionId;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const sections = applySectionOverrides(albumStructure, collection);
  const selectedSection = sections.find((section) => section.id === selectedSectionId) || sections[0];
  if (selectedSection) selectedSectionId = selectedSection.id;

  app.innerHTML = `
    <main class="shell">
      ${renderHeader()}
      <section class="screen" aria-live="polite">
        ${view === 'home' ? renderHome(sections) : ''}
        ${view === 'country' ? renderCountry(selectedSection) : ''}
        ${view === 'coca' ? renderCocaCola() : ''}
        ${view === 'stats' ? renderStats(sections) : ''}
      </section>
      ${renderBottomNav()}
      <div class="toast" data-toast role="status"></div>
    </main>
  `;

  bindEvents(sections);
}

function renderHeader() {
  const stats = getStats(albumStructure, collection);
  return `
    <header class="hero">
      <p class="eyebrow">Caderneta local · iOS 2026</p>
      <h1>Panini FIFA World Cup 2026</h1>
      <div class="hero-grid">
        <article class="glass metric-primary">
          <span>Completa</span>
          <strong>${stats.completionPercent}%</strong>
          <small>${stats.ownedCards}/${stats.totalCards} cartas</small>
        </article>
        <article class="glass"><span>Em falta</span><strong>${stats.totalCards - stats.ownedCards}</strong><small>total</small></article>
        <article class="glass"><span>Douradas</span><strong>${stats.missingSpecialCount}</strong><small>em falta</small></article>
        <article class="glass"><span>Coca-Cola</span><strong>${stats.missingCocaColaCount}</strong><small>em falta</small></article>
      </div>
    </header>
  `;
}

function renderHome(sections) {
  const stats = getStats(albumStructure, collection);
  const visibleSections = filterSections(sections, countrySearch);
  const searchSummary = countrySearch ? `${visibleSections.length}/${sections.length} secções` : `${sections.length} secções`;
  return `
    <div class="section-title">
      <div>
        <p class="eyebrow">Ordem oficial da caderneta</p>
        <h2>FWC + países</h2>
      </div>
      <button class="pill" data-action="toggle-editor">Editar ordem</button>
    </div>
    <article class="notice">
      <strong>Checklist oficial carregada e ainda editável.</strong>
      <span>A app usa a secção <code>FWC</code> antes das seleções e os 48 nomes/grafias da checklist Panini 2026. As douradas aparecem no início de cada conjunto; podes exportar o backup JSON.</span>
    </article>
    <section class="search-card" aria-label="Pesquisa de países">
      <label for="country-search">
        <span>Procurar país</span>
        <small>${searchSummary}</small>
      </label>
      <div class="search-field">
        <span aria-hidden="true">⌕</span>
        <input id="country-search" type="search" placeholder="Ex.: Portugal, Brazil, FWC" value="${escapeHtml(countrySearch)}" autocomplete="off" data-action="search-country">
      </div>
    </section>
    <section class="country-list">
      ${visibleSections.length ? visibleSections.map(renderCountryCard).join('') : '<p class="empty search-empty">Nenhum país encontrado.</p>'}
    </section>
    <section class="editor hidden" data-editor>
      <div class="section-title compact">
        <div>
            <p class="eyebrow">Editor simples</p>
          <h2>Corrigir nomes e ordem</h2>
        </div>
        <button class="pill secondary" data-action="reset-overrides">Repor</button>
      </div>
      <div class="editor-grid">
        ${sections.map((section) => `
          <label class="edit-row">
            <input inputmode="numeric" aria-label="Ordem ${section.name}" value="${escapeHtml(section.order)}" data-edit-order="${section.id}">
            <input aria-label="Nome ${section.name}" value="${escapeHtml(section.name)}" data-edit-name="${section.id}">
          </label>
        `).join('')}
      </div>
      <button class="primary wide" data-action="save-overrides">Guardar estrutura local</button>
    </section>
    <section class="quick-actions">
      <button class="primary" data-action="export-json">Exportar JSON</button>
      <label class="secondary file-button">Importar JSON<input type="file" accept="application/json" data-action="import-file"></label>
      <button class="danger" data-action="reset-all">Limpar progresso</button>
    </section>
    <p class="footer-note">Progresso geral: ${stats.ownedCards}/${stats.totalCards}. Os dados ficam neste browser/telemóvel via localStorage.</p>
  `;
}

function filterSections(sections, query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return sections;
  return sections.filter((section) => normalizeSearch(`${section.order} ${section.id} ${section.name}`).includes(normalizedQuery));
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function renderCountryCard(section) {
  const progress = getSectionProgress(section, collection);
  const gradient = `conic-gradient(var(--accent) ${progress.percent}%, var(--track) 0)`;
  const searchValue = normalizeSearch(`${section.order} ${section.name}`);
  return `
    <button class="country-card" data-action="open-country" data-section-id="${section.id}" data-country-card data-country-search="${escapeHtml(searchValue)}">
      <span class="order">${String(section.order).padStart(2, '0')}</span>
      <span class="country-info">
        <strong>${escapeHtml(section.name)}</strong>
        <small>${progress.ownedCount}/${progress.total} completas · ${progress.missingSpecial.length} dourada${progress.missingSpecial.length === 1 ? '' : 's'} em falta</small>
      </span>
      <span class="ring" style="background:${gradient}"><em>${progress.percent}%</em></span>
    </button>
  `;
}

function renderCountry(section) {
  if (!section) return '<p class="empty">Nenhuma secção criada.</p>';
  const progress = getSectionProgress(section, collection);
  const owned = new Set(collection.ownedBySection[section.id] || []);
  const ownedCards = section.cards.filter((card) => owned.has(card.number));
  return `
    <div class="section-title">
      <div>
        <p class="eyebrow">Secção ${String(section.order).padStart(2, '0')}</p>
        <h2>${escapeHtml(section.name)}</h2>
      </div>
      <select class="select" data-action="select-country" aria-label="Escolher secção">
        ${applySectionOverrides(albumStructure, collection).map((item) => `<option value="${item.id}" ${item.id === section.id ? 'selected' : ''}>${String(item.order).padStart(2, '0')} · ${escapeHtml(item.name)}</option>`).join('')}
      </select>
    </div>
    <article class="progress-card">
      <div>
        <strong>${progress.ownedCount}/${progress.total}</strong>
        <span>cartas completas</span>
      </div>
      <div class="progress-bar"><span style="width:${progress.percent}%"></span></div>
    </article>
    ${renderCardGroup('Douradas/especiais em falta', progress.missingSpecial, section.id, 'missing special')}
    ${renderCardGroup('Cartas em falta', progress.missingNormal, section.id, 'missing')}
    ${renderCardGroup('Já tenho · toca para voltar a marcar em falta', ownedCards, section.id, 'owned')}
  `;
}

function renderCardGroup(title, cards, sectionId, variant) {
  return `
    <section class="card-section">
      <div class="section-title compact"><h3>${title}</h3><span>${cards.length}</span></div>
      ${cards.length ? `<div class="sticker-grid">${cards.map((card) => renderSticker(card, sectionId, variant)).join('')}</div>` : '<p class="empty">Nada em falta aqui.</p>'}
    </section>
  `;
}

function renderSticker(card, sectionId, variant) {
  const special = card.kind !== 'normal';
  const label = card.label || (special ? 'especial' : 'falta');
  return `
    <button class="sticker ${special ? 'special' : ''} ${variant.includes('owned') ? 'owned' : ''}" data-action="toggle-card" data-section-id="${sectionId}" data-card-number="${card.number}" title="${escapeHtml(label)}">
      <span>${escapeHtml(card.number)}</span>
      <small>${escapeHtml(label)}</small>
    </button>
  `;
}

function renderCocaCola() {
  const owned = new Set(collection.cocaColaOwned || []);
  const missing = albumStructure.cocaCola.cards.filter((card) => !owned.has(card.number));
  const have = albumStructure.cocaCola.cards.filter((card) => owned.has(card.number));
  const percent = Math.round((have.length / albumStructure.cocaCola.cards.length) * 100);
  return `
    <div class="section-title"><div><p class="eyebrow">Página dedicada</p><h2>Coca-Cola x Panini</h2></div></div>
    <article class="progress-card red">
      <div><strong>${have.length}/12</strong><span>especiais completas</span></div>
      <div class="progress-bar"><span style="width:${percent}%"></span></div>
    </article>
    <section class="card-section">
      <div class="section-title compact"><h3>Coca-Cola em falta</h3><span>${missing.length}</span></div>
      <div class="sticker-grid">${missing.map(renderCocaSticker).join('') || '<p class="empty">Secção Coca-Cola completa.</p>'}</div>
    </section>
    <section class="card-section">
      <div class="section-title compact"><h3>Já tenho</h3><span>${have.length}</span></div>
      <div class="sticker-grid">${have.map(renderCocaSticker).join('') || '<p class="empty">Ainda nenhuma Coca-Cola marcada.</p>'}</div>
    </section>
  `;
}

function renderCocaSticker(card) {
  const owned = collection.cocaColaOwned.includes(card.number);
  return `
    <button class="sticker coke ${owned ? 'owned' : ''}" data-action="toggle-coca" data-card-number="${card.number}">
      <span>${card.number}</span>
      <small>${owned ? 'tenho' : 'falta'}</small>
    </button>
  `;
}

function renderStats(sections) {
  const stats = getStats(albumStructure, collection);
  const topMissing = sections
    .map((section) => ({ section, progress: getSectionProgress(section, collection) }))
    .sort((a, b) => (b.progress.total - b.progress.ownedCount) - (a.progress.total - a.progress.ownedCount))
    .slice(0, 8);
  return `
    <div class="section-title"><div><p class="eyebrow">Resumo</p><h2>Estatísticas</h2></div></div>
    <section class="stats-grid">
      <article><span>Total em falta</span><strong>${stats.totalCards - stats.ownedCards}</strong></article>
      <article><span>Cartas normais em falta</span><strong>${stats.missingNormalCount}</strong></article>
      <article><span>Douradas/especiais em falta</span><strong>${stats.missingSpecialCount}</strong></article>
      <article><span>Coca-Cola em falta</span><strong>${stats.missingCocaColaCount}</strong></article>
      <article class="wide"><span>Percentagem da caderneta completa</span><strong>${stats.completionPercent}%</strong></article>
    </section>
    <section class="card-section">
      <div class="section-title compact"><h3>Secções com mais faltas</h3></div>
      ${topMissing.map(({ section, progress }) => `
        <button class="stat-row" data-action="open-country" data-section-id="${section.id}">
          <span>${String(section.order).padStart(2, '0')} · ${escapeHtml(section.name)}</span>
          <strong>${progress.total - progress.ownedCount} falta${progress.total - progress.ownedCount === 1 ? '' : 'm'}</strong>
        </button>
      `).join('')}
    </section>
    <section class="quick-actions">
      <button class="primary" data-action="export-json">Exportar backup JSON</button>
      <label class="secondary file-button">Importar backup<input type="file" accept="application/json" data-action="import-file"></label>
    </section>
  `;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav" aria-label="Navegação principal">
      ${navItems.map(([id, label, icon]) => `
        <button class="${view === id ? 'active' : ''}" data-action="nav" data-view="${id}">
          <span>${icon}</span><small>${label}</small>
        </button>
      `).join('')}
    </nav>
  `;
}

function bindEvents(sections) {
  app.querySelectorAll('[data-action="nav"]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  app.querySelectorAll('[data-action="search-country"]').forEach((input) => input.addEventListener('input', () => {
    countrySearch = input.value;
    render();
    const nextInput = app.querySelector('[data-action="search-country"]');
    nextInput?.focus();
    nextInput?.setSelectionRange(countrySearch.length, countrySearch.length);
  }));
  app.querySelectorAll('[data-action="open-country"]').forEach((button) => button.addEventListener('click', () => setView('country', button.dataset.sectionId)));
  app.querySelectorAll('[data-action="toggle-card"]').forEach((button) => {
    button.addEventListener('click', () => {
      persist(toggleCard(collection, button.dataset.sectionId, button.dataset.cardNumber), `Carta ${button.dataset.cardNumber} atualizada`);
    });
  });
  app.querySelectorAll('[data-action="toggle-coca"]').forEach((button) => {
    button.addEventListener('click', () => persist(toggleCocaCola(collection, button.dataset.cardNumber), `Coca-Cola ${button.dataset.cardNumber} atualizada`));
  });
  app.querySelectorAll('[data-action="select-country"]').forEach((select) => select.addEventListener('change', () => setView('country', select.value)));
  app.querySelectorAll('[data-action="toggle-editor"]').forEach((button) => button.addEventListener('click', () => {
    const editor = app.querySelector('[data-editor]');
    editor?.classList.toggle('hidden');
    if (!editor?.classList.contains('hidden')) editor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  app.querySelectorAll('[data-action="save-overrides"]').forEach((button) => button.addEventListener('click', () => {
    const overrides = sections.map((section) => ({
      id: section.id,
      order: Number(app.querySelector(`[data-edit-order="${section.id}"]`)?.value || section.order),
      name: app.querySelector(`[data-edit-name="${section.id}"]`)?.value || section.name,
    }));
    persist(updateSectionOverrides(collection, overrides, albumStructure), 'Estrutura guardada localmente');
  }));
  app.querySelectorAll('[data-action="reset-overrides"]').forEach((button) => button.addEventListener('click', () => {
    persist(updateSectionOverrides(collection, albumStructure.countries, albumStructure), 'Ordem reposta');
  }));
  app.querySelectorAll('[data-action="export-json"]').forEach((button) => button.addEventListener('click', exportJson));
  app.querySelectorAll('[data-action="import-file"]').forEach((input) => input.addEventListener('change', importJson));
  app.querySelectorAll('[data-action="reset-all"]').forEach((button) => button.addEventListener('click', () => {
    if (window.confirm('Limpar todo o progresso guardado neste browser?')) persist(createEmptyCollection(albumStructure), 'Progresso limpo');
  }));
}

function exportJson() {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), albumTitle: albumStructure.title, collection }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `panini-2026-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Backup JSON exportado');
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const imported = parsed.collection || parsed;
    persist(normalizeCollection(imported, albumStructure), 'Backup JSON importado');
  } catch (error) {
    showToast('JSON inválido');
  } finally {
    event.target.value = '';
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

render();
