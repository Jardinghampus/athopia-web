import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveEditorialResponsibility,
  EDITORIAL_FALLBACK,
} from './editorial-responsibility.js';

test('namngiven person visas när env är satt', () => {
  const r = resolveEditorialResponsibility('Anna Andersson');
  assert.equal(r.label, 'Anna Andersson');
  assert.equal(r.isNamedPerson, true);
});

test('trimmar omgivande blanksteg', () => {
  assert.equal(resolveEditorialResponsibility('  Anna Andersson  ').label, 'Anna Andersson');
});

test('faller tillbaka på verksamheten när env saknas', () => {
  const r = resolveEditorialResponsibility(undefined);
  assert.equal(r.label, EDITORIAL_FALLBACK);
  assert.equal(r.isNamedPerson, false);
});

test('tom eller blank env räknas som inte utsedd', () => {
  assert.equal(resolveEditorialResponsibility('').isNamedPerson, false);
  assert.equal(resolveEditorialResponsibility('   ').isNamedPerson, false);
});

test('platshållare läcker aldrig ut i produktion', () => {
  // Exakt strängen som stod live 2026-08-02.
  for (const placeholder of ['[namn ska fastställas]', '[TBD]', '[fyll i]', 'TBD', 'todo']) {
    const r = resolveEditorialResponsibility(placeholder);
    assert.equal(r.isNamedPerson, false, `${placeholder} ska inte räknas som person`);
    assert.equal(r.label, EDITORIAL_FALLBACK);
  }
});

test('etiketten innehåller aldrig hakparenteser', () => {
  for (const input of [undefined, '', '[namn ska fastställas]', 'Anna Andersson']) {
    assert.ok(
      !/[[\]]/.test(resolveEditorialResponsibility(input).label),
      `hakparentes läckte för indata: ${String(input)}`,
    );
  }
});
