import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
  mountSportsPage,
  renderSportDetail,
  renderSportsList
} from '../../public/js/sports.js';

function createSportsDom() {
  return new JSDOM(`
    <main id="sports-page">
      <form id="sports-filters">
        <input name="name" />
        <input name="osmKey" />
        <input name="category" />
        <input name="environment" />
        <select name="missingMetadata">
          <option value="">Todos</option>
          <option value="true">Incompletos</option>
        </select>
        <select name="limit">
          <option value="5">5</option>
          <option value="10" selected>10</option>
        </select>
        <button type="submit">Buscar</button>
        <button type="button" id="sports-clear">Limpiar</button>
      </form>
      <p id="sports-status" class="status-text"></p>
      <div id="sport-detail"></div>
      <div id="sports-results"></div>
      <button type="button" id="sports-prev">Anterior</button>
      <span id="sports-page-indicator">Página 1</span>
      <button type="button" id="sports-next">Siguiente</button>
      <form id="sport-form">
        <input type="hidden" name="id" />
        <input name="name" />
        <input name="osmKey" />
        <input name="category" />
        <input name="environment" />
        <button type="submit" data-sport-save-mode="put">Guardar</button>
        <button type="submit" data-sport-save-mode="patch">Guardar parcial</button>
        <button type="button" id="sport-form-reset">Limpiar</button>
      </form>
      <p id="sport-form-status" class="status-text"></p>
    </main>
  `, { url: 'http://localhost/sports' });
}

function createSport(id = '507f1f77bcf86cd799439011') {
  return {
    id,
    name: 'tenis',
    osmKey: 'tennis',
    category: 'racket',
    environment: 'outdoor'
  };
}

test('renderSportsList muestra deportes con metadatos', () => {
  const html = renderSportsList([createSport('sport-1')]);

  assert.match(html, /tenis/);
  assert.match(html, /tennis/);
  assert.match(html, /racket/);
  assert.match(html, /outdoor/);
  assert.match(html, /data-sport-id="sport-1"/);
});

test('renderSportsList muestra estado vacío si no hay deportes', () => {
  const html = renderSportsList([]);

  assert.match(html, /No hay deportes disponibles/);
});

test('renderSportDetail muestra los datos principales del deporte', () => {
  const html = renderSportDetail(createSport('sport-1'));

  assert.match(html, /sport-1/);
  assert.match(html, /tenis/);
  assert.match(html, /tennis/);
  assert.match(html, /racket/);
});

test('La página de deportes filtra, pagina y abre detalle', async () => {
  const dom = createSportsDom();
  const root = dom.window.document.querySelector('#sports-page');
  const requested = [];
  const fetchImpl = async (url, options = {}) => {
    requested.push({ url, options });

    if (/\/sports\/[^?]+$/.test(url)) {
      return {
        ok: true,
        json: async () => ({ data: createSport() })
      };
    }

    const records = Array.from({ length: url.includes('limit=5') ? 5 : 1 }, (_, index) => ({
      ...createSport(`507f1f77bcf86cd79943901${index}`),
      name: index === 0 ? 'tenis' : `tenis ${index}`
    }));

    return {
      ok: true,
      json: async () => ({
        data: records,
        pagination: { page: 1, limit: records.length }
      })
    };
  };

  await mountSportsPage(root, { fetchImpl });

  root.querySelector('input[name="name"]').value = 'ten';
  root.querySelector('input[name="osmKey"]').value = 'tennis';
  root.querySelector('input[name="category"]').value = 'racket';
  root.querySelector('input[name="environment"]').value = 'outdoor';
  root.querySelector('select[name="missingMetadata"]').value = 'true';
  root.querySelector('select[name="limit"]').value = '5';
  root.querySelector('#sports-filters').dispatchEvent(
    new dom.window.Event('submit', { bubbles: true, cancelable: true })
  );

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(
    requested.some(({ url }) => (
      url.includes('name=ten')
      && url.includes('osmKey=tennis')
      && url.includes('category=racket')
      && url.includes('environment=outdoor')
      && url.includes('missingMetadata=true')
      && url.includes('limit=5')
    )),
    true
  );

  root.querySelector('[data-sport-id="507f1f77bcf86cd799439010"]').click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(root.querySelector('#sport-detail').textContent, /tenis/);

  root.querySelector('#sports-next').click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(root.querySelector('#sports-page-indicator').textContent, /Página 2/);
  assert.equal(requested.some(({ url }) => url.includes('page=2') && url.includes('limit=5')), true);
});

test('La página de deportes crea, actualiza parcialmente y elimina deportes', async () => {
  const dom = createSportsDom();
  const root = dom.window.document.querySelector('#sports-page');
  const requested = [];
  const fetchImpl = async (url, options = {}) => {
    requested.push({ url, options });

    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
      return {
        ok: true,
        json: async () => ({ data: createSport() })
      };
    }

    if (options.method === 'DELETE') {
      return {
        ok: true,
        json: async () => ({ status: 200, message: 'Deporte eliminado correctamente' })
      };
    }

    if (/\/sports\/[^?]+$/.test(url)) {
      return {
        ok: true,
        json: async () => ({ data: createSport() })
      };
    }

    return {
      ok: true,
      json: async () => ({ data: [createSport()], pagination: { page: 1, limit: 10 } })
    };
  };

  await mountSportsPage(root, { fetchImpl, confirmImpl: () => true });

  root.querySelector('#sport-form input[name="name"]').value = 'tenis';
  root.querySelector('#sport-form input[name="osmKey"]').value = 'tennis';
  root.querySelector('#sport-form input[name="category"]').value = 'racket';
  root.querySelector('#sport-form input[name="environment"]').value = 'outdoor';
  root.querySelector('#sport-form').dispatchEvent(
    new dom.window.SubmitEvent('submit', {
      bubbles: true,
      cancelable: true,
      submitter: root.querySelector('[data-sport-save-mode="put"]')
    })
  );

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(requested.some(({ options }) => options.method === 'POST'), true);
  assert.match(root.querySelector('#sport-form-status').textContent, /creado/);

  root.querySelector('[data-sport-edit-id="507f1f77bcf86cd799439011"]').click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  root.querySelector('#sport-form input[name="category"]').value = 'indoor';
  root.querySelector('#sport-form').dispatchEvent(
    new dom.window.SubmitEvent('submit', {
      bubbles: true,
      cancelable: true,
      submitter: root.querySelector('[data-sport-save-mode="patch"]')
    })
  );

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(requested.some(({ options }) => options.method === 'PATCH'), true);
  assert.match(root.querySelector('#sport-form-status').textContent, /parcialmente/);

  root.querySelector('[data-sport-delete-id="507f1f77bcf86cd799439011"]').click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(requested.some(({ options }) => options.method === 'DELETE'), true);
});

test('La página de deportes muestra errores de la API', async () => {
  const dom = createSportsDom();
  const root = dom.window.document.querySelector('#sports-page');
  const fetchImpl = async () => ({
    ok: false,
    json: async () => ({ message: 'missingMetadata debe ser true o false.' })
  });

  await mountSportsPage(root, { fetchImpl });

  assert.match(root.querySelector('#sports-status').textContent, /missingMetadata debe ser/);
  assert.equal(root.querySelector('#sports-status').classList.contains('is-error'), true);
});
