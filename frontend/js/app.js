import { filterByCategory } from '/js/post/filterPosts.js';
import { init } from '/js/router.js';
import '/js/chat/onlineUsers.js';

window.filterByCategory = filterByCategory;

init();