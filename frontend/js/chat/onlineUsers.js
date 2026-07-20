import { connectWebSocket, sendWebSocketMessage } from "../websocket.js";

const $ = id => document.getElementById(id), myId = () => +(JSON.parse(localStorage.getItem('currentUser')||'{}').id || 0);

const handleSocketMessage = m => {
    if (m.Type === 'status') {
        const d = $('online-users-list')?.querySelector(`.user-item[data-id="${m.UserID}"] .user-status`);
        if (d) d.className = `user-status ${m.Online ? 'online' : 'offline'}`;
    } else if (!$('chat-view-conversation')?.classList.contains('hidden') && +$('sidebar-receiver-id')?.value === +m.SenderID) {
        appendMsg(m, +m.SenderID === myId());
    } else notifyMsg(m);
};

export function initOnlineSocket() {
    if (myId()) connectWebSocket(handleSocketMessage);
}
initOnlineSocket();

function notifyMsg(m) {
    if (!m.Content || +m.SenderID === myId()) return;
    let b = $('msg-badge') || $('nav-messages')?.appendChild(Object.assign(document.createElement('span'), { id: 'msg-badge', className: 'msg-badge' }));
    if (b) b.textContent = (+b.textContent || 0) + 1;
    const u = $('online-users-list')?.querySelector(`.user-item[data-id="${m.SenderID}"]`);
    if (u && !u.querySelector('.msg-badge')) u.appendChild(Object.assign(document.createElement('span'), { className: 'msg-badge', textContent: 'New' }));
    const t = Object.assign(document.body.appendChild(document.createElement('div')), { className: 'msg-toast', innerHTML: `💬 <b>New message:</b> ${m.Content.slice(0,30)}` });
    t.onclick = () => { if (!$('contentLayout')?.classList.contains('chat-active')) toggleChatSidebar(); u?.click(); t.remove(); };
    setTimeout(() => t.remove(), 4000);
}

export const toggleChatSidebar = () => { if ($('contentLayout')?.classList.toggle('chat-active')) { $('msg-badge')?.remove(); initOnlineSocket(); loadUsers(); } };
export const switchChatView = v => { $('chat-view-users')?.classList.toggle('hidden', v !== 'users'); $('chat-view-conversation')?.classList.toggle('hidden', v !== 'conversation'); if (v === 'users') loadUsers(); };

async function loadUsers() {
    if (!$('online-users-list')) return;
    try {
        const users = await (await fetch('/api/users')).json();
        $('online-users-list').innerHTML = users.filter(u => +u.id !== myId()).map(u => `
            <div class="user-item" data-id="${u.id}" data-name="${u.username||u.nickname}">
                <div class="user-avatar">${(u.username||'U')[0].toUpperCase()}</div><span>${u.username||u.nickname}</span><div class="user-status ${u.online?'online':'offline'}"></div>
            </div>`).join('') || '<p style="padding:16px;color:#64748b">No members found.</p>';
    } catch { $('online-users-list').innerHTML = '<p style="padding:16px;color:#ef4444">Error.</p>'; }
}

let chatOffset = 0, loadingOlder = false, hasMore = true;

function appendMsg(msg, isSelf, prepend = false) {
    const box = $('sidebar-messages');
    if (!box || (msg.ID && box.querySelector(`[data-msg-id="${msg.ID}"]`))) return;
    const el = document.createElement('div'), p = document.createElement('span');
    el.className = `chat-message ${isSelf ? 'self' : 'other'}`;
    if (msg.ID) el.dataset.msgId = msg.ID;
    p.textContent = msg.Content || '';
    const time = new Date(msg.CreatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = `<span class="message-sender">${isSelf ? 'You' : ($('active-chat-username')?.textContent||'User')}:</span><span class="message-content">${p.innerHTML}</span><span class="msg-time">${time}</span>`;
    box[prepend ? 'prepend' : 'appendChild'](el);
    if (!prepend) { box.scrollTop = box.scrollHeight; chatOffset++; }
}

const scrollBox = $('sidebar-messages');
if (scrollBox) scrollBox.onscroll = async e => {
    const box = e.target, id = $('sidebar-receiver-id')?.value;
    if (box.scrollTop === 0 && !loadingOlder && hasMore && id) {
        loadingOlder = true;
        try {
            const msgs = await (await fetch(`/chat?receiver=${id}&limit=10&offset=${chatOffset}`)).json();
            if (!msgs?.length) hasMore = false;
            else {
                const oldH = box.scrollHeight;
                msgs.forEach(m => appendMsg(m, m.SenderID === myId(), true));
                box.scrollTop = box.scrollHeight - oldH;
                if ((chatOffset += msgs.length) < 10) hasMore = false;
            }
        } catch {}
        loadingOlder = false;
    }
};

const userList = $('online-users-list');
if (userList) userList.onclick = async e => {
    const item = e.target.closest('.user-item');
    if (!item) return;
    $('msg-badge')?.remove(); item.querySelector('.msg-badge')?.remove();
    $('sidebar-receiver-id').value = item.dataset.id;
    $('active-chat-username').textContent = item.dataset.name;
    switchChatView('conversation');
    const box = $('sidebar-messages');
    if (box) box.innerHTML = '';
    chatOffset = 0; loadingOlder = false; hasMore = true;
    try {
        const msgs = await (await fetch(`/chat?receiver=${item.dataset.id}&limit=10&offset=0`)).json();
        if ((chatOffset = msgs?.length || 0) < 10) hasMore = false;
        (msgs || []).reverse().forEach(m => appendMsg(m, m.SenderID === myId()));
    } catch {}
};

const chatForm = $('sidebar-chat-form');
if (chatForm) chatForm.onsubmit = e => {
    e.preventDefault();
    const inp = $('sidebar-chat-input'), id = $('sidebar-receiver-id')?.value, content = inp?.value.trim();
    if (content && id && sendWebSocketMessage(id, content)) {
        appendMsg({ Content: content, CreatedAt: new Date() }, true);
        inp.value = '';
    }
};

Object.assign(window, { toggleChatSidebar, switchChatView, initOnlineSocket });
