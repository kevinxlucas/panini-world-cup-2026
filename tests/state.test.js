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
  it('creates the FWC section, 48 official country sections, and 12 Coca-Cola cards', () => {
    assert.equal(albumStructure.countries.length, 49);
    assert.equal(albumStructure.countries[0].id, 'fwc');
    assert.equal(albumStructure.countries[1].name, 'Mexico');
    assert.equal(albumStructure.countries.at(-1).name, 'Panama');
    assert.equal(albumStructure.cocaCola.cards.length, 12);
    assert.equal(albumStructure.countries.every((section) => section.cards.length === 20), true);
    assert.equal(albumStructure.countries.slice(1).every((section) => section.cards[0].kind !== 'normal'), true);
  });

  it('tracks country progress and missing special cards', () => {
    const first = albumStructure.countries[1];
    let collection = createEmptyCollection(albumStructure);
    collection = toggleCard(collection, first.id, first.cards[0].number, true);
    collection = toggleCard(collection, first.id, first.cards[18].number, true);

    const progress = getSectionProgress(first, collection);
    assert.equal(progress.ownedCount, 2);
    assert.equal(progress.missingNormal.length, 18);
    assert.equal(progress.missingSpecial.length, 0);
  });

  it('toggles cards back to missing for undo', () => {
    const first = albumStructure.countries[1];
    let collection = createEmptyCollection(albumStructure);
    collection = toggleCard(collection, first.id, first.cards[0].number, true);
    collection = toggleCard(collection, first.id, first.cards[0].number, false);
    assert.equal(getSectionProgress(first, collection).ownedCount, 0);
  });

  it('calculates global stats including Coca-Cola specials', () => {
    const first = albumStructure.countries[0];
    let collection = createEmptyCollection(albumStructure);
    collection = toggleCard(collection, first.id, first.cards[0].number, true);
    collection = toggleCocaCola(collection, 'C1', true);

    const stats = getStats(albumStructure, collection);
    assert.equal(stats.totalCards, 992);
    assert.equal(stats.ownedCards, 2);
    assert.equal(stats.missingCocaColaCount, 11);
  });

  it('keeps country order/name editable and normalizes imported JSON', () => {
    let collection = createEmptyCollection(albumStructure);
    collection = updateSectionOverrides(collection, [{ id: 'rsa', order: 0, name: 'Novo País' }], albumStructure);
    const sections = applySectionOverrides(albumStructure, collection);
    assert.equal(sections[0].id, 'rsa');
    assert.equal(sections[0].name, 'Novo País');

    const imported = normalizeCollection({ ownedBySection: { mex: ['MEX1', '999'] }, cocaColaOwned: ['C1', 'C99'] }, albumStructure);
    assert.deepEqual(imported.ownedBySection.mex, ['MEX1']);
    assert.deepEqual(imported.cocaColaOwned, ['C1']);

    const staleOverrides = normalizeCollection({
      sourceAlbumSchemaVersion: albumStructure.schemaVersion - 1,
      sectionOverrides: [{ id: 'kor', order: 4, name: 'Korea Republic' }],
    }, albumStructure);
    assert.equal(staleOverrides.sectionOverrides.find((item) => item.id === 'kor').name, 'South Korea');
  });
});
