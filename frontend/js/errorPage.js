import { navigateTo } from './router.js';

const ERRORS = {
  400: ['Bad Request', 'The server could not understand your request.'],
  401: ['Unauthorized', 'You need to be logged in to access this page.'],
  403: ['Forbidden', "You don't have permission to access this page."],
  404: ['Page Not Found', "The page you're looking for doesn't exist or has been moved."],
  500: ['Internal Server Error', 'Something went wrong on our end. Please try again later.'],
  503: ['Service Unavailable', 'The server is temporarily unavailable. Please try again later.']
};

export function ErrorPageView(status = 404) {
  const [title, desc] = ERRORS[status] || ['Unexpected Error', 'Something went wrong.'];
  const dom = document.createElement('div');
  dom.className = 'error-box';
  dom.innerHTML = `
    <div class="big-error">${status}</div>
    <h1>${title}</h1>
    <p>${desc}</p>
    <button class="home-button">Back to Home</button>
  `;

  return {
    dom,
    logic: () => dom.querySelector('.home-button')?.addEventListener('click', () => navigateTo('/'))
  };
}

export function renderError(status = 404) {
  const app = document.getElementById('app');
  if (!app) return;
  const { dom, logic } = ErrorPageView(status);
  app.replaceChildren(dom);
  logic();
}