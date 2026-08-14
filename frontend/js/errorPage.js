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
        <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
        </div>
        <div class="big-error">${status}</div>
        <h1>${message}</h1>
        <p>Something went wrong. Let's get you back on track.</p>
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