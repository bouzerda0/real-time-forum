import { filterByCategory } from '/js/post/filterPosts.js';
import { initRouter } from '/js/router.js';

// Setup background cursor blur animation
const cursorBlur = document.getElementById('cursor-blur');

if (window.innerWidth > 768) {
    document.addEventListener('mousemove', (e) => {
        const offset = cursorBlur.offsetWidth / 2;

        const x = e.clientX - offset;
        const y = e.clientY - offset;

        cursorBlur.style.transform = `translate(${x}px, ${y}px)`;
    });
}

window.filterByCategory = filterByCategory;

initRouter();
