import { filterByCategory } from '/js/post/filterPosts.js';
import { init } from '/js/router.js';
import '/js/chat/onlineUsers.js';
import '/js/chat/chat.js';

window.filterByCategory = filterByCategory;

init();