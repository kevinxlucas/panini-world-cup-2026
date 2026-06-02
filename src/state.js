export const STORAGE_KEY = 'panini-world-cup-2026:v1';

const nowIso = () => new Date().toISOString();

export function createEmptyCollection(albumStructure) {
  return {
    schemaVersion: 1,
    sourceAlbumSchemaVersion: albumStructure.schemaVersion,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ownedBySection: {},
    cocaColaOwned: [],
    sectionOverrides: albumStructure.countries.map((section) => ({
      id: section.id,
      order: section.order,
      name: section.name,
    })),
  };
}

export function normalizeCollection(value, albumStructure) {
  const fresh = createEmptyCollection(albumStructure);
  const imported = value && typeof value === 'object' ? value : {};
  const sameAlbumSchema = Number(imported.sourceAlbumSchemaVersion) === Number(albumStructure.schemaVersion);
  const ownedBySection = imported.ownedBySection && typeof imported.ownedBySection === 'object'
    ? imported.ownedBySection
    : {};

  return {
    ...fresh,
    ...imported,
    schemaVersion: 1,
    sourceAlbumSchemaVersion: albumStructure.schemaVersion,
    ownedBySection: Object.fromEntries(
      albumStructure.countries.map((section) => {
        const valid = new Set(section.cards.map((card) => card.number));
        const owned = Array.isArray(ownedBySection[section.id]) ? ownedBySection[section.id] : [];
        return [section.id, [...new Set(owned.map(String).filter((cardNumber) => valid.has(cardNumber)))]];
      })
    ),
    cocaColaOwned: [...new Set(Array.isArray(imported.cocaColaOwned) ? imported.cocaColaOwned.map(String) : [])]
      .filter((cardNumber) => albumStructure.cocaCola.cards.some((card) => card.number === cardNumber)),
    sectionOverrides: mergeSectionOverrides(sameAlbumSchema ? imported.sectionOverrides : undefined, albumStructure),
    updatedAt: imported.updatedAt || nowIso(),
  };
}

export function mergeSectionOverrides(overrides, albumStructure) {
  const byId = new Map(Array.isArray(overrides) ? overrides.map((item) => [item.id, item]) : []);
  return albumStructure.countries.map((section) => {
    const override = byId.get(section.id) || {};
    return {
      id: section.id,
      order: Number.isFinite(Number(override.order)) ? Number(override.order) : section.order,
      name: typeof override.name === 'string' && override.name.trim() ? override.name.trim() : section.name,
    };
  });
}

export function applySectionOverrides(albumStructure, collection) {
  const overrides = new Map(collection.sectionOverrides.map((override) => [override.id, override]));
  return albumStructure.countries
    .map((section) => ({ ...section, ...(overrides.get(section.id) || {}) }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'pt-PT'));
}

export function loadCollection(albumStructure, storage = globalThis.localStorage) {
  if (!storage) return createEmptyCollection(albumStructure);
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyCollection(albumStructure);
  try {
    return normalizeCollection(JSON.parse(raw), albumStructure);
  } catch {
    return createEmptyCollection(albumStructure);
  }
}

export function saveCollection(collection, storage = globalThis.localStorage) {
  const next = { ...collection, updatedAt: nowIso() };
  storage?.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isOwned(collection, sectionId, cardNumber) {
  return Boolean(collection.ownedBySection[sectionId]?.includes(String(cardNumber)));
}

export function toggleCard(collection, sectionId, cardNumber, owned = undefined) {
  const current = new Set(collection.ownedBySection[sectionId] || []);
  const key = String(cardNumber);
  const shouldOwn = owned === undefined ? !current.has(key) : Boolean(owned);
  if (shouldOwn) current.add(key);
  else current.delete(key);
  return {
    ...collection,
    ownedBySection: {
      ...collection.ownedBySection,
      [sectionId]: [...current].sort(sortCardNumbers),
    },
    updatedAt: nowIso(),
  };
}

export function toggleCocaCola(collection, cardNumber, owned = undefined) {
  const current = new Set(collection.cocaColaOwned || []);
  const key = String(cardNumber);
  const shouldOwn = owned === undefined ? !current.has(key) : Boolean(owned);
  if (shouldOwn) current.add(key);
  else current.delete(key);
  return { ...collection, cocaColaOwned: [...current].sort(sortCardNumbers), updatedAt: nowIso() };
}

export function updateSectionOverrides(collection, overrides, albumStructure) {
  return {
    ...collection,
    sectionOverrides: mergeSectionOverrides(overrides, albumStructure),
    updatedAt: nowIso(),
  };
}

export function getSectionProgress(section, collection) {
  const owned = new Set(collection.ownedBySection[section.id] || []);
  const total = section.cards.length;
  const ownedCount = section.cards.filter((card) => owned.has(card.number)).length;
  const missingNormal = section.cards.filter((card) => card.kind === 'normal' && !owned.has(card.number));
  const missingSpecial = section.cards.filter((card) => card.kind !== 'normal' && !owned.has(card.number));
  return { total, ownedCount, missingNormal, missingSpecial, percent: total ? Math.round((ownedCount / total) * 100) : 0 };
}

export function getStats(albumStructure, collection) {
  const countrySections = applySectionOverrides(albumStructure, collection);
  const countryCards = countrySections.flatMap((section) => section.cards.map((card) => ({ ...card, sectionId: section.id })));
  const ownedCountryCount = countryCards.filter((card) => isOwned(collection, card.sectionId, card.number)).length;
  const totalCountryCount = countryCards.length;
  const missingNormalCount = countryCards.filter((card) => card.kind === 'normal' && !isOwned(collection, card.sectionId, card.number)).length;
  const missingSpecialCount = countryCards.filter((card) => card.kind !== 'normal' && !isOwned(collection, card.sectionId, card.number)).length;
  const totalCocaColaCount = albumStructure.cocaCola.cards.length;
  const missingCocaColaCount = albumStructure.cocaCola.cards.filter((card) => !collection.cocaColaOwned.includes(card.number)).length;
  const totalCards = totalCountryCount + totalCocaColaCount;
  const ownedCards = ownedCountryCount + (totalCocaColaCount - missingCocaColaCount);
  return {
    totalCards,
    ownedCards,
    totalCountryCount,
    ownedCountryCount,
    missingNormalCount,
    missingSpecialCount,
    totalCocaColaCount,
    missingCocaColaCount,
    completionPercent: totalCards ? Math.round((ownedCards / totalCards) * 1000) / 10 : 0,
  };
}

function sortCardNumbers(a, b) {
  const aNum = Number(String(a).replace(/\D/g, ''));
  const bNum = Number(String(b).replace(/\D/g, ''));
  return aNum - bNum || String(a).localeCompare(String(b), 'pt-PT');
}
