import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { albumStructure } from '../src/albumData.js';
import {
  applySectionOverrides,
  createEmptyCollection,
  getSectionProgress,
  getStats,
  normalizeCollection,
  toggleCard,
  toggleCocaCola,
  updateSectionOverrides,
} from '../src/state.js';

describe('Panini collection state', () => {
  it('creates a 48-country album plus 12 Coca-Cola cards', () => {
    assert.equal(albumStructure.countries.length, 48);
    assert.equal(albumStructure.cocaCola.cards.length, 12);
    assert.equal(albumStructure.countries.every((section) => section.cards.length === 20), true);
  });

  it('tracks country progress and missing special cards', () => {
    const first = albumStructure.countries[0];
    let collection = createEmptyCollection(albumStructure);
    collection = toggleCard(collection, first.id, first.cards[0].number, true);
    collection = toggleCard(collection, first.id, first.cards[18].number, true);

    const progress = getSectionProgress(first, collection);
    assert.equal(progress.ownedCount, 2);
    assert.equal(progress.missingNormal.length, 17);
    assert.equal(progress.missingSpecial.length, 1);
  });

  it('toggles cards back to missing for undo', () => {
    const first = albumStructure.countries[0];
    let collection = createEmptyCollection(albumStructure);
    collection = toggleCard(collection, first.id, '001', true);
    collection = toggleCard(collection, first.id, '001', false);
    assert.equal(getSectionProgress(first, collection).ownedCount, 0);
  });

  it('calculates global stats including Coca-Cola specials', () => {
    const first = albumStructure.countries[0];
    let collection = createEmptyCollection(albumStructure);
    collection = toggleCard(collection, first.id, first.cards[0].number, true);
    collection = toggleCocaCola(collection, 'C1', true);

    const stats = getStats(albumStructure, collection);
    assert.equal(stats.totalCards, 972);
    assert.equal(stats.ownedCards, 2);
    assert.equal(stats.missingCocaColaCount, 11);
  });

  it('keeps country order/name editable and normalizes imported JSON', () => {
    let collection = createEmptyCollection(albumStructure);
    collection = updateSectionOverrides(collection, [{ id: 'country-02', order: 1, name: 'Novo País' }], albumStructure);
    const sections = applySectionOverrides(albumStructure, collection);
    assert.equal(sections[0].id, 'country-02');
    assert.equal(sections[0].name, 'Novo País');

    const imported = normalizeCollection({ ownedBySection: { 'country-01': ['001', '999'] }, cocaColaOwned: ['C1', 'C99'] }, albumStructure);
    assert.deepEqual(imported.ownedBySection['country-01'], ['001']);
    assert.deepEqual(imported.cocaColaOwned, ['C1']);
  });
});
