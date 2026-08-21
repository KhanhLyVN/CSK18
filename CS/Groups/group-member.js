(function () {
    "use strict";
  
    const HOME_URL = "/CS/homepageCS/trangchu-cs.html";
    const GROUPS = "groups";
    const MESSAGE_COLLECTION = "memberMessages";
    const $ = (id) => document.getElementById(id);
    const state = { user: null, profile: null, groups: [], selected: null, unsubscribeMessages: null, toastTimer: null, isBooted: false };
  
    const escapeHTML = (value) => {
      const element = document.createElement("div");
      element.textContent = value == null ? "" : String(value);
      return element.innerHTML;
    };
  
    const initials = (name, email) => String(name || email || "?").trim().split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "?";
  
    function toast(message, isError) {
      const toastElement = $("toast");
      toastElement.textContent = message;
      toastElement.className = `toast show${isError ? " error" : ""}`;
      clearTimeout(state.toastTimer);
      state.toastTimer = setTimeout(() => { toastElement.className = "toast"; }, 3200);
    }
  
    function isMemberOfGroup(group, uid) {
      const memberIds = Array.isArray(group.memberIds) ? group.memberIds : [];
      const members = Array.isArray(group.members) ? group.members : [];
      return memberIds.includes(uid) || members.some((member) => String(member.uid || member.id || "") === String(uid));
    }
  
    function memberList(group) {
      const leaderUid = String(group.leaderUid || "");
      const members = Array.isArray(group.members) ? group.members : [];
      const result = members
        .filter((member) => String(member.uid || member.id || "") && String(member.uid || member.id || "") !== leaderUid)
        .map((member) => ({ uid: member.uid || member.id, name: member.name || member.displayName || "CS thành viên", email: member.email || "" }));
  
      if (!result.some((member) => String(member.uid) === String(state.user?.uid)) && state.user) {
        result.push({ uid: state.user.uid, name: state.profile?.name || state.user.displayName || state.user.email || "Tôi", email: state.user.email || "" });
      }
  
      return result;
    }
  
    function renderGroups() {
      $("groupCount").textContent = `${state.groups.length} nhóm`;
      if (!state.groups.length) {
        $("groupList").innerHTML = '<div class="empty-state">Bạn chưa được thêm vào nhóm CS nào. Hãy liên hệ CS Leader hoặc Admin.</div>';
        return;
      }
  
      $("groupList").innerHTML = state.groups.map((group) => {
        const active = state.selected?.id === group.id ? " is-active" : "";
        const count = memberList(group).length;
        return `<button class="group-card${active}" type="button" data-group-id="${escapeHTML(group.id)}"><strong>${escapeHTML(group.name || "Nhóm chưa đặt tên")}</strong>${group.code ? `<span class="group-code">${escapeHTML(group.code)}</span>` : ""}<span class="group-meta">${count} CS con · Mở chat nhóm</span></button>`;
      }).join("");
    }
  
    function renderMembers(group) {
      const members = memberList(group);
      $("membersStrip").innerHTML = members.length
        ? members.map((member) => `<span class="member-pill${String(member.uid) === String(state.user?.uid) ? " is-me" : ""}"><span class="mini-avatar">${escapeHTML(initials(member.name, member.email))}</span>${escapeHTML(member.name)}</span>`).join("")
        : '<span class="member-pill">Chưa có CS con trong nhóm</span>';
    }
  
    function showWorkspace(group) {
      $("chatEmpty").hidden = true;
      $("chatWorkspace").hidden = false;
      $("chatTitle").textContent = group.name || "Nhóm chưa đặt tên";
      $("chatAvatar").textContent = initials(group.name, group.code);
      $("chatSubtitle").textContent = "Đang tải thành viên...";
      $("messageList").innerHTML = '<div class="loading">Đang tải tin nhắn...</div>';
      $("messageInput").disabled = true;
      $("sendMessageBtn").disabled = true;
      renderMembers(group);
      const count = memberList(group).length;
      $("chatSubtitle").textContent = `${count} CS con trong nhóm · Chỉ thành viên mới xem được trao đổi này`;
    }
  
    function formatTime(value) {
      const date = value?.toDate ? value.toDate() : value?.seconds ? new Date(value.seconds * 1000) : null;
      if (!date) return "Đang gửi...";
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
  
    function renderMessages(messages) {
      const list = $("messageList");
      if (!messages.length) {
        list.innerHTML = '<div class="empty-state">Chưa có tin nhắn nào. Hãy gửi lời chào tới các CS cùng nhóm.</div>';
        return;
      }
  
      list.innerHTML = `<div class="message-day">Trao đổi trong nhóm</div>${messages.map((message) => {
        const isMine = String(message.senderUid || "") === String(state.user?.uid || "");
        const senderName = message.senderName || message.name || "CS thành viên";
        const text = message.text || message.message || "";
        return `<article class="message-row${isMine ? " is-me" : ""}">${isMine ? "" : `<span class="message-avatar">${escapeHTML(initials(senderName, message.senderEmail))}</span>`}<div class="message-bubble"><div class="message-name">${escapeHTML(isMine ? "Bạn" : senderName)}</div><div class="message-text">${escapeHTML(text)}</div><div class="message-time">${escapeHTML(formatTime(message.createdAt))}</div></div></article>`;
      }).join("")}`;
      list.scrollTop = list.scrollHeight;
    }
  
    function watchMessages(group) {
      if (state.unsubscribeMessages) state.unsubscribeMessages();
      state.unsubscribeMessages = firebase.firestore().collection(GROUPS).doc(group.id).collection(MESSAGE_COLLECTION).orderBy("createdAt", "asc").onSnapshot((snapshot) => {
        renderMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        $("messageInput").disabled = false;
        $("sendMessageBtn").disabled = false;
      }, (error) => {
        console.error("Không thể tải tin nhắn nhóm:", error);
        $("messageList").innerHTML = '<div class="empty-state">Không thể tải tin nhắn của nhóm. Vui lòng kiểm tra quyền truy cập Firebase.</div>';
        $("messageInput").disabled = true;
        $("sendMessageBtn").disabled = true;
        toast("Không thể tải tin nhắn nhóm.", true);
      });
    }
  
    function selectGroup(groupId) {
      const group = state.groups.find((item) => item.id === groupId);
      if (!group) return;
      state.selected = group;
      renderGroups();
      showWorkspace(group);
      watchMessages(group);
    }
  
    async function loadMemberGroups() {
      const database = firebase.firestore();
      let groups = [];
      try {
        const snapshot = await database.collection(GROUPS).where("memberIds", "array-contains", state.user.uid).get();
        groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.warn("Không thể lọc nhóm bằng memberIds, thử tải danh sách nhóm:", error);
        const snapshot = await database.collection(GROUPS).get();
        groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      }
  
      state.groups = groups
        .filter((group) => String(group.leaderUid || "") !== String(state.user.uid) && isMemberOfGroup(group, state.user.uid))
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"));
      renderGroups();
  
      if (state.groups.length) {
        selectGroup(state.groups[0].id);
      }
    }
  
    async function sendMessage(event) {
      event.preventDefault();
      const text = $("messageInput").value.trim();
      if (!state.selected || !text) return;
      const button = $("sendMessageBtn");
      button.disabled = true;
      button.textContent = "Đang gửi...";
  
      try {
        await firebase.firestore().collection(GROUPS).doc(state.selected.id).collection(MESSAGE_COLLECTION).add({
          senderUid: state.user.uid,
          senderName: state.profile?.name || state.user.displayName || state.user.email || "CS thành viên",
          senderEmail: state.user.email || "",
          senderType: "cs_member",
          text,
          message: text,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        $("messageInput").value = "";
        $("messageInput").focus();
      } catch (error) {
        console.error("Không thể gửi tin nhắn nhóm:", error);
        toast("Không thể gửi tin nhắn. Vui lòng thử lại.", true);
      } finally {
        button.disabled = false;
        button.textContent = "Gửi";
      }
    }
  
    function bootIfReady() {
      if (state.isBooted || !state.user || !state.profile) return;
      if (state.profile.isLeader) {
        window.location.replace(HOME_URL);
        return;
      }
      state.isBooted = true;
      $("currentUserChip").textContent = state.profile.name || state.user.email || "CS thành viên";
      loadMemberGroups().catch((error) => {
        console.error("Không thể tải nhóm CS con:", error);
        $("groupList").innerHTML = '<div class="empty-state">Không thể tải nhóm. Vui lòng kiểm tra kết nối hoặc quyền Firebase.</div>';
        toast("Không thể tải danh sách nhóm.", true);
      });
    }
  
    document.addEventListener("cs:role-ready", (event) => {
      state.profile = event.detail;
      bootIfReady();
    });
  
    if (window.csCurrentProfile) {
      state.profile = window.csCurrentProfile;
    }
  
    $("groupList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-group-id]");
      if (button) selectGroup(button.dataset.groupId);
    });
    $("chatComposer").addEventListener("submit", sendMessage);
    $("messageInput").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        $("chatComposer").requestSubmit();
      }
    });
  
    const auth = firebase.auth();
    auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.replace(HOME_URL);
        return;
      }
      state.user = user;
      bootIfReady();
    });
  })();
  