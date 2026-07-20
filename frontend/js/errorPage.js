import { navigateTo } from './router.js';

const ERROR_META = {
  400: {
    title: 'Bad Request',
    desc: 'The server could not understand your request.',
  },
  401: {
    title: 'Unauthorized',
    desc: 'You need to be logged in to access this page.',
  },
  403: {
    title: 'Forbidden',
    desc: "You don't have permission to access this page.",
  },
  404: {
    title: 'Page Not Found',
    desc: "The page you're looking for doesn't exist or has been moved.",
  },
  500: {
    title: 'Internal Server Error',
    desc: 'Something went wrong on our end. Please try again later.',
  },
  503: {
    title: 'Service Unavailable',
    desc: 'The server is temporarily unavailable. Please try again later.',
  },
};

export function ErrorPageView(status = 404) {
  if (typeof status !== 'number' && typeof status !== 'string') {
    status = 404;
  }
  const meta = ERROR_META[status] || {
    title: 'Unexpected Error',
    desc: 'Something went wrong.',
  };

  const dom = document.createElement('div');
  dom.className = 'error-page';
  dom.innerHTML = `
    <div class="error-code">${status}</div>
    <h1>${meta.title}</h1>
    <p>${meta.desc}</p>
    <button class="error-home-btn" data-action="nav" data-target="/">Back to Home</button>
  `;

  const logic = () => {
    const navBtn = dom.querySelector('button[data-action="nav"]');
    if (navBtn) {
      navBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = navBtn.getAttribute('data-target') || '/';
        navigateTo(target);
      });
    }
  };

  return { dom, logic };
}

export function renderError(status = 404) {
  const app = document.getElementById('app');
  if (!app) return;
  const view = ErrorPageView(status);
  app.innerHTML = '';
  app.appendChild(view.dom);
  if (view.logic) view.logic();
}