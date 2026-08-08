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
  const [title, desc] = ERRORS[status] || ['Unexpected Error', 'Something went wrong.'];
  const dom = document.createElement('div');
  dom.className = 'error-wrapper';
  dom.innerHTML = `
    <div class="error-box">
        <div class="big-error">${status}</div>
        <h1>${title}</h1>
        <p>${desc}</p>
        <button class="home-button">Back to Home</button>
    </div>
  `;

  return {
    dom,
    logic: () => dom.querySelector('.home-button')?.addEventListener('click', () => navigateTo('/'))
  };
}

export function renderError(status = 404) {
  const app = document.getElementById('app');
  if (!app) return;
  const { dom, logic } = errorView(status);
  app.replaceChildren(dom);
  logic();
}