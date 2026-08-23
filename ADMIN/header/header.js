(function () {
  'use strict';
  if (window.__HEADER_ADMIN_CHAT_LOADED__) return;
  window.__HEADER_ADMIN_CHAT_LOADED__ = true;

  const state = { user: null, profile: null, users: [], groups: [], selected: null, mode: 'direct', roomId: '', unreadByUser: {}, directUnread: 0, groupUnread: 0, messagesUnsub: null, roomsUnsub: null, noticesUnsub: null, authUnsub: null, groupUnsub: null, initialized: false, sending: false };
  const $ = (id) => document.getElementById(id);
  const db = () => window.firebase?.firestore?.() || null;
  const auth = () => window.firebase?.auth?.() || null;
  const stamp = () => window.firebase?.firestore?.FieldValue?.serverTimestamp?.() || new Date();
  const esc = (value) => { const node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; };
  const millis = (value) => value?.toMillis ? value.toMillis() : value?.toDate ? value.toDate().getTime() : typeof value?.seconds === 'number' ? value.seconds * 1000 : value instanceof Date ? value.getTime() : 0;
  const nameOf = (user) => String(user?.displayName || user?.name || user?.fullName || user?.email || 'Người dùng').trim();
  const initials = (value) => String(value || 'U').trim().split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'U';
  const roomIdFor = (a, b) => [String(a || ''), String(b || '')].filter(Boolean).sort().join('__');
  const directRoomIdsFor = (a, b) => [...new Set([roomIdFor(a, b), [String(a || ''), String(b || '')].filter(Boolean).sort().join('_')].filter(Boolean))];
  const senderOf = (message) => String(message?.senderId || message?.senderUID || message?.senderUid || message?.from || message?.uid || '');
  const bodyOf = (message) => String(message?.text ?? message?.message ?? message?.content ?? message?.body ?? '');
  const setText = (id, value) => { const node = $(id); if (node) node.textContent = String(value ?? ''); };
  const chatPanel = () => $('headerChatPanel');

  function setChatBadge(value) { const badge = $('headerChatBadge'); const total = Math.max(0, Number(value) || 0); if (!badge) return; badge.hidden = total === 0; badge.textContent = total > 99 ? '99+' : String(total); }
  function setNoticeBadge(value) { const badge = $('noticeBadge'); const total = Math.max(0, Number(value) || 0); if (!badge) return; badge.hidden = total === 0; badge.textContent = total > 99 ? '99+' : String(total); }
  function status(value) { setText('headerChatStatus', value); }
  function closeChatPanel() { const panel = chatPanel(); if (panel) { panel.hidden = true; panel.setAttribute('aria-hidden', 'true'); } $('headerChatBtn')?.setAttribute('aria-expanded', 'false'); }
  async function openChatPanel() { const panel = chatPanel(); if (!panel) return; panel.hidden = false; panel.setAttribute('aria-hidden', 'false'); $('headerChatBtn')?.setAttribute('aria-expanded', 'true'); await loadUsers(); await loadGroups(); }

  async function loadProfile() {
    const firestore = db(); const user = state.user; if (!firestore || !user) return null;
    try { const doc = await firestore.collection('users').doc(user.uid).get(); state.profile = doc.exists ? { uid: user.uid, ...doc.data() } : { uid: user.uid, name: user.displayName || '', email: user.email || '' }; }
    catch (error) { state.profile = { uid: user.uid, name: user.displayName || '', email: user.email || '' }; }
    setText('topAdminName', nameOf(state.profile)); setText('topAdminAvatar', initials(nameOf(state.profile))); return state.profile;
  }
  async function loadUsers() {
    const firestore = db(); const user = state.user; if (!firestore || !user) return;
    try { const snapshot = await firestore.collection('users').get(); state.users = snapshot.docs.map((doc) => ({ uid: String(doc.data()?.uid || doc.id), ...doc.data() })).filter((item) => item.uid && item.uid !== String(user.uid)).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'vi')); renderUsers(); renderGroupMembers(); }
    catch (error) { const list = $('headerChatUsers'); if (list) list.innerHTML = '<p>Không tải được danh sách người dùng.</p>'; }
  }
  function renderUsers() {
    const list = $('headerChatUsers'); if (!list) return; const keyword = String($('headerChatSearch')?.value || '').trim().toLowerCase();
    const users = state.users.filter((item) => !keyword || nameOf(item).toLowerCase().includes(keyword) || String(item.email || '').toLowerCase().includes(keyword));
    if (!users.length) { list.innerHTML = '<p>Không có người dùng phù hợp.</p>'; return; }
    list.innerHTML = users.map((item) => { const unread = Number(state.unreadByUser[item.uid] || 0); return `<div class="header-chat-user ${unread ? 'is-unread' : ''}" data-header-user="${esc(item.uid)}" role="button" tabindex="0"><span class="header-chat-avatar">${esc(initials(nameOf(item)))}</span><span><strong>${esc(nameOf(item))}</strong><small>${esc(item.email || item.role || 'Thành viên')}</small></span>${unread ? `<b class="header-chat-unread">${unread > 99 ? '99+' : unread}</b>` : ''}</div>`; }).join('');
  }
  function renderGroupMembers() { const host = $('headerGroupMembers'); if (!host) return; host.innerHTML = state.users.map((item) => `<label><input type="checkbox" value="${esc(item.uid)}"><span>${esc(nameOf(item))}</span></label>`).join('') || '<p>Chưa có người dùng.</p>'; }
  async function createNotification(recipientUid, payload) { const firestore = db(); if (!firestore || !recipientUid || String(recipientUid) === String(state.user?.uid)) return; try { await firestore.collection('csNotifications').doc(String(recipientUid)).collection('items').add({ recipientUid: String(recipientUid), read: false, createdAt: stamp(), ...payload }); } catch (error) { console.warn('[HEADER CHAT] Không tạo được notification:', error); } }
  async function findDirectRoomIds(firestore, user, target) {
    const roomIds = new Set(directRoomIdsFor(user.uid, target.uid));
    const collect = (snapshot) => snapshot.forEach((doc) => {
      const room = doc.data() || {};
      const participants = [...(Array.isArray(room.participants) ? room.participants : []), ...(Array.isArray(room.participantIds) ? room.participantIds : [])].map(String);
      if (participants.includes(String(user.uid)) && participants.includes(String(target.uid))) roomIds.add(doc.id);
    });
    for (const field of ['participants', 'participantIds']) {
      try { collect(await firestore.collection('chats').where(field, 'array-contains', user.uid).get()); }
      catch (error) { console.warn('[HEADER CHAT] Không tìm được room theo ' + field + ':', error); }
    }
    return [...roomIds];
  }
  function listenDirectRooms(firestore, roomIds) {
    const messageMap = new Map();
    const renderCombined = () => renderMessages([...messageMap.values()].sort((a, b) => millis(a.createdAt || a.timestamp || a.updatedAt) - millis(b.createdAt || b.timestamp || b.updatedAt)));
    const mergeSnapshot = (candidate, snapshot) => {
      [...messageMap.keys()].filter((key) => key.startsWith(`${candidate}/`)).forEach((key) => messageMap.delete(key));
      snapshot.docs.forEach((doc) => messageMap.set(`${candidate}/${doc.id}`, { id: doc.id, ...doc.data() }));
      renderCombined();
    };
    const loadFallback = (candidate) => firestore.collection('chats').doc(candidate).collection('messages').get().then((snapshot) => mergeSnapshot(candidate, snapshot)).catch((error) => {
      console.error('[HEADER CHAT] Không tải được room chat:', candidate, error);
      if (!messageMap.size) $('headerChatMessages').innerHTML = '<p>Không tải được tin nhắn. Hãy tải lại trang và thử lại.</p>';
    });
    const unsubs = roomIds.map((candidate) => {
      const messagesRef = firestore.collection('chats').doc(candidate).collection('messages');
      loadFallback(candidate);
      return messagesRef.onSnapshot((snapshot) => mergeSnapshot(candidate, snapshot), (error) => {
        console.error('[HEADER CHAT] MESSAGE LISTENER ERROR:', candidate, error);
        loadFallback(candidate);
      });
    });
    state.messagesUnsub = () => unsubs.forEach((unsubscribe) => { try { unsubscribe(); } catch (error) {} });
  }
  async function openDirect(uid) {
    const target = state.users.find((item) => String(item.uid) === String(uid)); const firestore = db(); const user = state.user; if (!target || !firestore || !user) return;
    stopMessages(); state.mode = 'direct'; state.selected = target; state.roomId = roomIdFor(user.uid, target.uid);
    $('headerChatListView').hidden = true; $('headerChatConversation').hidden = false; setText('headerChatName', nameOf(target)); setText('headerChatRole', target.email || target.role || 'Thành viên'); setText('headerChatAvatar', initials(nameOf(target))); status(`Đang trò chuyện với ${nameOf(target)}`); $('headerChatMessages').innerHTML = '<p>Đang tải tin nhắn...</p>';
    const roomIds = await findDirectRoomIds(firestore, user, target);
    const roomRef = firestore.collection('chats').doc(state.roomId);
    roomRef.set({ participants: [user.uid, target.uid], participantIds: [user.uid, target.uid], participantNames: { [user.uid]: nameOf(state.profile || user), [target.uid]: nameOf(target) }, updatedAt: stamp() }, { merge: true }).catch((error) => console.warn('[HEADER CHAT] Không thể cập nhật metadata room:', error));
    Promise.all(roomIds.map((roomId) => markRoomRead(roomId))).catch(() => {});
    listenDirectRooms(firestore, roomIds);
  }
  async function loadGroups() { const firestore = db(); const user = state.user; if (!firestore || !user) return; try { const snapshot = await firestore.collection('chatGroups').where('participants', 'array-contains', user.uid).get(); state.groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })); renderGroups(); } catch (error) { const host = $('headerChatGroups'); if (host) host.innerHTML = '<p>Không tải được nhóm.</p>'; } }
  function renderGroups() { const host = $('headerChatGroups'); if (!host) return; host.innerHTML = state.groups.length ? state.groups.map((group) => `<div class="header-chat-user" data-header-group="${esc(group.id)}" role="button" tabindex="0"><span class="header-chat-avatar">${esc(initials(group.name || 'Nhóm'))}</span><span><strong>${esc(group.name || 'Nhóm chat')}</strong><small>${(group.participants || []).length} thành viên</small></span></div>`).join('') : '<p>Chưa có nhóm chat.</p>'; }
  async function openGroup(id) { const group = state.groups.find((item) => String(item.id) === String(id)); const firestore = db(); if (!group || !firestore) return; stopMessages(); state.mode = 'group'; state.selected = group; state.roomId = group.id; $('headerChatListView').hidden = true; $('headerChatConversation').hidden = false; setText('headerChatName', group.name || 'Nhóm chat'); setText('headerChatRole', `${(group.participants || []).length} thành viên`); setText('headerChatAvatar', initials(group.name || 'Nhóm')); $('headerChatMessages').innerHTML = '<p>Đang tải tin nhắn...</p>'; state.messagesUnsub = firestore.collection('chatGroups').doc(group.id).collection('messages').orderBy('createdAt', 'asc').onSnapshot((snapshot) => renderMessages(snapshot.docs.map((doc) => doc.data() || {})), () => { $('headerChatMessages').innerHTML = '<p>Không tải được tin nhắn nhóm.</p>'; }); }
  function renderMessages(messages) { const host = $('headerChatMessages'); const user = state.user; if (!host || !user) return; host.innerHTML = messages.length ? messages.map((item) => `<div class="header-chat-bubble ${senderOf(item) === String(user.uid) ? 'mine' : ''}">${esc(bodyOf(item) || 'Tin nhắn không có nội dung')}</div>`).join('') : '<p>Hãy gửi tin nhắn đầu tiên.</p>'; host.scrollTop = host.scrollHeight; }
  function stopMessages() { if (typeof state.messagesUnsub === 'function') try { state.messagesUnsub(); } catch (error) {} state.messagesUnsub = null; }
  async function markRoomRead(roomId) { const firestore = db(); const user = state.user; if (!firestore || !user || !roomId) return; try { const snapshot = await firestore.collection('chats').doc(roomId).collection('messages').get(); const batch = firestore.batch(); let changed = false; snapshot.forEach((doc) => { const message = doc.data() || {}; const receiver = String(message.to || message.receiverId || message.receiverUID || message.recipientId || ''); if (receiver === String(user.uid) && senderOf(message) !== String(user.uid) && message.read !== true) { batch.set(doc.ref, { read: true, readAt: stamp() }, { merge: true }); changed = true; } }); if (changed) await batch.commit(); } catch (error) { console.warn('[HEADER CHAT] Không thể đánh dấu đã đọc:', error); } }
  async function sendMessage(event) { event.preventDefault(); if (state.sending || !state.selected || !state.user) return; const text = String($('headerChatInput')?.value || '').trim(); const firestore = db(); if (!text || !firestore) return; state.sending = true; try { if (state.mode === 'group') { const group = state.selected; const groupRef = firestore.collection('chatGroups').doc(group.id); const participants = Array.isArray(group.participants) ? group.participants.map(String) : []; const batch = firestore.batch(); const messageRef = groupRef.collection('messages').doc(); batch.set(messageRef, { from: state.user.uid, senderId: state.user.uid, senderName: nameOf(state.profile || state.user), text, message: text, createdAt: stamp(), read: false }); batch.set(groupRef, { lastMessage: text, lastMessageBy: state.user.uid, updatedAt: stamp() }, { merge: true }); participants.filter((uid) => uid !== String(state.user.uid)).forEach((uid) => batch.set(firestore.collection('csNotifications').doc(uid).collection('items').doc(), { type: 'chat_group_message', senderId: state.user.uid, senderName: nameOf(state.profile || state.user), chatGroupId: group.id, title: `${nameOf(state.profile || state.user)} đã gửi tin nhắn trong ${group.name || 'nhóm chat'}`, preview: text.slice(0, 180), read: false, createdAt: stamp() })); await batch.commit(); } else { const target = state.selected; const roomId = roomIdFor(state.user.uid, target.uid); const roomRef = firestore.collection('chats').doc(roomId); const now = stamp(); await roomRef.set({ participants: [state.user.uid, target.uid], participantIds: [state.user.uid, target.uid], participantNames: { [state.user.uid]: nameOf(state.profile || state.user), [target.uid]: nameOf(target) }, lastMessage: text, lastMessageBy: state.user.uid, lastMessageSenderId: state.user.uid, lastMessageReadBy: state.user.uid, updatedAt: now }, { merge: true }); await roomRef.collection('messages').add({ from: state.user.uid, to: target.uid, senderId: state.user.uid, senderUID: state.user.uid, senderName: nameOf(state.profile || state.user), receiverId: target.uid, receiverUID: target.uid, receiverName: nameOf(target), text, message: text, createdAt: now, timestamp: now, read: false }); await createNotification(target.uid, { type: 'chat_message', senderId: state.user.uid, senderName: nameOf(state.profile || state.user), roomId, chatId: roomId, title: `${nameOf(state.profile || state.user)} đã gửi tin nhắn cho bạn`, preview: text.slice(0, 180) }); } $('headerChatInput').value = ''; } catch (error) { console.error('[HEADER CHAT] SEND ERROR:', error); status('Không gửi được tin nhắn.'); } finally { state.sending = false; } }
  async function createGroup(event) { event.preventDefault(); const firestore = db(); const user = state.user; const name = String($('headerGroupName')?.value || '').trim(); const memberIds = [...($('headerGroupMembers')?.querySelectorAll('input:checked') || [])].map((input) => input.value); if (!firestore || !user || !name) return; const participants = [...new Set([user.uid, ...memberIds])]; const names = {}; participants.forEach((uid) => { const profile = uid === user.uid ? (state.profile || user) : state.users.find((item) => item.uid === uid); names[uid] = nameOf(profile); }); try { const ref = await firestore.collection('chatGroups').add({ name, participants, participantNames: names, createdBy: user.uid, createdAt: stamp(), updatedAt: stamp(), lastMessage: '' }); $('headerGroupName').value = ''; await loadGroups(); await openGroup(ref.id); } catch (error) { status('Không thể tạo nhóm.'); } }
  function listenUnreadRooms() { const firestore = db(); const user = state.user; if (!firestore || !user) return; try { state.roomsUnsub?.(); } catch (error) {} state.roomsUnsub = firestore.collection('chats').onSnapshot(async (snapshot) => { const rooms = snapshot.docs.filter((doc) => { const item = doc.data() || {}; const participants = [...(item.participants || []), ...(item.participantIds || [])].map(String); return participants.includes(String(user.uid)); }); const next = {}; let total = 0; await Promise.all(rooms.map(async (doc) => { const item = doc.data() || {}; const participants = [...(item.participants || []), ...(item.participantIds || [])].map(String); const other = participants.find((id) => id !== String(user.uid)); const messages = await doc.ref.collection('messages').get(); let count = 0; messages.forEach((messageDoc) => { const message = messageDoc.data() || {}; if (String(message.to || message.receiverId || '') === String(user.uid) && message.read !== true) count += 1; }); if (other && count) next[other] = (next[other] || 0) + count; total += count; })); state.unreadByUser = next; state.directUnread = total; setChatBadge(state.directUnread + state.groupUnread); renderUsers(); }); }
  function listenNotifications() { const firestore = db(); const user = state.user; if (!firestore || !user) return; try { state.noticesUnsub?.(); } catch (error) {} state.noticesUnsub = firestore.collection('csNotifications').doc(user.uid).collection('items').orderBy('createdAt', 'desc').limit(40).onSnapshot((snapshot) => { const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })); const unread = items.filter((item) => !item.read).length; state.groupUnread = items.filter((item) => item.type === 'chat_group_message' && !item.read).length; setChatBadge(state.directUnread + state.groupUnread); setNoticeBadge(unread); setText('notificationCount', unread ? `${unread} thông báo mới` : 'Không có thông báo mới'); renderNotifications(items); }); }
  function renderNotifications(items) { const host = $('headerNotificationList'); if (!host) return; host.innerHTML = items.length ? items.map((item) => `<button type="button" class="notification-item ${item.read ? '' : 'unread'}" data-header-notice="${esc(item.id)}"><span class="notification-icon"><span class="material-symbols-rounded">chat</span></span><span class="notification-content"><strong>${esc(item.title || 'Thông báo mới')}</strong><p>${esc(item.preview || '')}</p></span></button>`).join('') : '<div class="notification-empty"><span class="material-symbols-rounded">notifications_none</span><p>Không có thông báo mới</p></div>'; host.querySelectorAll('[data-header-notice]').forEach((button) => button.addEventListener('click', async () => { const item = items.find((entry) => entry.id === button.dataset.headerNotice); if (!item) return; await db()?.collection('csNotifications').doc(state.user.uid).collection('items').doc(item.id).set({ read: true, readAt: stamp() }, { merge: true }); $('notificationPanel').hidden = true; await openChatPanel(); if (item.senderId) await openDirect(item.senderId); })); }
  async function markAllNoticesRead() { const firestore = db(); const user = state.user; if (!firestore || !user) return; const snapshot = await firestore.collection('csNotifications').doc(user.uid).collection('items').where('read', '==', false).get(); const batch = firestore.batch(); snapshot.forEach((doc) => batch.set(doc.ref, { read: true, readAt: stamp() }, { merge: true })); if (!snapshot.empty) await batch.commit(); }
  function showTab(tab) { const groups = tab === 'groups'; $('headerFriendsView').hidden = groups; $('headerGroupsView').hidden = !groups; document.querySelectorAll('[data-header-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.headerTab === tab)); if (groups) loadGroups(); }
  function bindEvents() { $('headerChatBtn')?.addEventListener('click', () => chatPanel()?.hidden ? openChatPanel() : closeChatPanel()); $('headerChatClose')?.addEventListener('click', closeChatPanel); $('headerChatSearch')?.addEventListener('input', renderUsers); document.addEventListener('click', (event) => { const tab = event.target.closest('[data-header-tab]'); if (tab) showTab(tab.dataset.headerTab); const user = event.target.closest('[data-header-user]'); if (user) openDirect(user.dataset.headerUser); const group = event.target.closest('[data-header-group]'); if (group) openGroup(group.dataset.headerGroup); }); $('headerChatBack')?.addEventListener('click', () => { stopMessages(); $('headerChatConversation').hidden = true; $('headerChatListView').hidden = false; }); $('headerChatForm')?.addEventListener('submit', sendMessage); $('headerGroupForm')?.addEventListener('submit', createGroup); $('noticeBtn')?.addEventListener('click', () => { const panel = $('notificationPanel'); panel.hidden = !panel.hidden; }); $('headerMarkAllRead')?.addEventListener('click', markAllNoticesRead); }
  async function ensureHeaderMarkup() {
    if ($('sharedAdminHeader')) return true;
    const host = document.getElementById('adminBar') || document.querySelector('[data-shared-header-host]');
    if (!host) return false;
    const script = Array.from(document.scripts).find((item) => /header\.js(?:$|\?)/i.test(item.src || ''));
    const url = script?.src ? new URL('header.html', script.src).href : 'header.html';
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      host.innerHTML = await response.text();
      return Boolean($('sharedAdminHeader'));
    } catch (error) {
      console.error('[HEADER CHAT] Không tải được header.html:', error);
      return false;
    }
  }
  function bindAuthWhenReady(attempt = 0) {
    const instance = auth();
    if (!instance) {
      if (attempt < 40) setTimeout(() => bindAuthWhenReady(attempt + 1), 250);
      return;
    }
    if (state.authUnsub) return;
    state.authUnsub = instance.onAuthStateChanged(async (user) => {
      if (!user) return;
      state.user = user;
      await loadProfile();
      await loadUsers();
      listenUnreadRooms();
      listenNotifications();
    });
  }
  async function start() { if (state.initialized) return; if (!await ensureHeaderMarkup()) return; state.initialized = true; bindEvents(); bindAuthWhenReady(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
