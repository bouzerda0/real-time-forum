import { navigateTo } from './router.js';

const ERRORS = {
  400: ['Bad Request'],
  401: ['Unauthorized'],
  403: ['Forbidden'],
  404: ['Page Not Found'],
  500: ['Internal Server Error'],
  503: ['Service Unavailable']
};

export function errorView(status = 404) {
  const [message] = ERRORS[status] || ['Unexpected Error'];
  const dom = document.createElement('div');
  dom.className = 'error-wrapper';
  dom.innerHTML = `
    <div class="error-box">
        <div class="big-error">${status}</div>
        <h1>${message}</h1>
        <button class="home-button">Back to Home</button>
    </div>
  `;

  return {
    dom,
    logic: () => dom.querySelector('.home-button')?.addEventListener('click', () => navigateTo('/'))
  };
}

export function showError(status = 500) {
  const container = document.querySelector('#app');
  if (!container) return;

  const view = errorView(status);
  container.replaceChildren(view.dom);
  view.logic?.();
}