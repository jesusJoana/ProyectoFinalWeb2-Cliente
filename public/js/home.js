import { fetchApiStatus } from './api.js';

export async function mountHomePage(rootElement, dependencies = {}) {
  const { fetchImpl = globalThis.fetch } = dependencies;
  const statusNode = rootElement.querySelector('#api-status-text');

  if (!statusNode) {
    return;
  }

  try {
    const payload = await fetchApiStatus(fetchImpl);
    statusNode.textContent = `API disponible: ${payload.message}`;
    statusNode.classList.add('is-success');
  } catch (error) {
    statusNode.textContent = error.message;
    statusNode.classList.add('is-error');
  }
}

const rootElement = typeof document !== 'undefined'
  ? document.querySelector('#home-page')
  : null;

if (rootElement) {
  mountHomePage(rootElement);
}
