import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import test from 'node:test';

const views = [
  { file: 'views/index.html', currentPath: '/', currentText: 'Inicio' },
  { file: 'views/installations.html', currentPath: '/installations', currentText: 'Instalaciones' },
  { file: 'views/sports.html', currentPath: '/sports', currentText: 'Deportes' },
  { file: 'views/weather-records.html', currentPath: '/weather-records', currentText: 'Histórico meteorológico' }
];

test('Todas las vistas mantienen navegación principal y enlace activo', () => {
  for (const view of views) {
    const dom = new JSDOM(readFileSync(view.file, 'utf8'));
    const document = dom.window.document;
    const nav = document.querySelector('nav[aria-label="Navegación principal"]');
    const activeLink = nav?.querySelector('a[aria-current="page"]');

    assert.ok(nav, `${view.file} debe tener navegación principal`);
    assert.equal(nav.querySelectorAll('a').length, 4);
    assert.equal(activeLink?.getAttribute('href'), view.currentPath);
    assert.equal(activeLink?.textContent.trim(), view.currentText);
  }
});
