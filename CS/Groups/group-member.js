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

    function isLeaderOfGroup(group, uid) {
      const leader = group?.leader || {};
      const leaderUid = group?.leaderUid || leader.uid || leader.id || "";
      return String(leaderUid) === String(uid || "");
    }
  
    function memberList(group) {
      const participants = new Map();
      const leader = group.leader || {};
      const leaderUid = String(group.leaderUid || leader.uid || leader.id || "");
      const members = Array.isArray(group.members) ? group.members : [];
      if (leaderUid) {
        participants.set(leaderUid, {
          uid: leaderUid,
          name: group.leaderName || leader.name || leader.displayName || "CS Leader",
          email: group.leaderEmail || leader.email || "",
          role: "leader"
        });
      }

      members.forEach((member) => {
        const uid = String(member.uid || member.id || "");
        if (!uid) return;
        participants.set(uid, {
          uid,
          name: member.name || member.displayName || "CS thành viên",
          email: member.email || "",
          role: String(uid) === leaderUid ? "leader" : "member"
        });
      });

      (Array.isArray(group.memberIds) ? group.memberIds : []).forEach((memberUid) => {
        const uid = String(memberUid || "");
        if (!uid || participants.has(uid)) return;
        participants.set(uid, {
          uid,
          name: uid === leaderUid ? "CS Leader" : "CS thành viên",
          email: "",
          role: uid === leaderUid ? "leader" : "member"
        });
      });

      const result = [...participants.values()];

      if (!result.some((member) => String(member.uid) === String(state.user?.uid)) && state.user) {
        result.push({ uid: state.user.uid, name: state.profile?.name || state.user.displayName || state.user.email || "Tôi", email: state.user.email || "", role: isLeaderOfGroup(group, state.user.uid) ? "leader" : "member" });
      }
  
      return result;
    }
  
    function renderGroups() {
      const groupList = $("groupList");
      const groupCount = $("groupCount");
  
      if (!state.groups.length) {
        if (groupCount) groupCount.textContent = "0 nhóm";
        if (groupList) groupList.innerHTML = '<div class="loading">Bạn chưa thuộc nhóm CS nào.</div>';
        $("chatEmpty").hidden = false;
        $("chatEmpty").innerHTML = '<div class="empty-mark">CS</div><h2>Bạn chưa thuộc nhóm CS nào</h2><p>Hãy liên hệ CS Leader hoặc Admin để được thêm vào Group trước khi trao đổi.</p>';
        return;
      }
  
      if (groupCount) groupCount.textContent = `${state.groups.length} nhóm`;
      if (groupList) {
        groupList.innerHTML = state.groups.map((group) => `<button class="group-item${group.id === state.selected?.id ? " is-active" : ""}" type="button" data-group-id="${escapeHTML(group.id)}"><span class="group-item-mark">${escapeHTML(initials(group.name, group.code))}</span><span><strong>${escapeHTML(group.name || "Nhóm chưa đặt tên")}</strong><small>${memberList(group).length} thành viên CS</small></span></button>`).join("");
      }
    }
  
    function renderMembers(group) {
      const members = memberList(group);
      $("membersStrip").innerHTML = members.length
        ? members.map((member) => `<span class="member-pill${String(member.uid) === String(state.user?.uid) ? " is-me" : ""}${member.role === "leader" ? " is-leader" : ""}"><span class="mini-avatar">${escapeHTML(initials(member.name, member.email))}</span>${escapeHTML(member.name)}${member.role === "leader" ? " · Leader" : ""}</span>`).join("")
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
      $("chatSubtitle").textContent = `${count} thành viên CS · Leader và CS con cùng trao đổi trong nhóm`;
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
        const attachment = message.attachmentUrl ? `<a class="message-attachment" href="${escapeHTML(message.attachmentUrl)}" target="_blank" rel="noopener">Tệp đính kèm · ${escapeHTML(message.attachmentName || "Mở tệp")}</a>` : "";
        return `<article class="message-row${isMine ? " is-me" : ""}">${isMine ? "" : `<span class="message-avatar">${escapeHTML(initials(senderName, message.senderEmail))}</span>`}<div class="message-bubble"><div class="message-name">${escapeHTML(isMine ? "Bạn" : senderName)}${message.senderType === "cs_leader" ? " · Leader" : ""}</div>${text ? `<div class="message-text">${escapeHTML(text)}</div>` : ""}${attachment}<div class="message-time">${escapeHTML(formatTime(message.createdAt))}</div></div></article>`;
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
      const groupsById = new Map();
      try {
        const [memberSnapshot, leaderSnapshot] = await Promise.all([
          database.collection(GROUPS).where("memberIds", "array-contains", state.user.uid).get(),
          database.collection(GROUPS).where("leaderUid", "==", state.user.uid).get()
        ]);
        [...memberSnapshot.docs, ...leaderSnapshot.docs].forEach((doc) => groupsById.set(doc.id, { id: doc.id, ...doc.data() }));
      } catch (error) {
        console.warn("Không thể lọc nhóm bằng truy vấn chỉ mục, thử tải danh sách nhóm:", error);
        const snapshot = await database.collection(GROUPS).get();
        snapshot.docs.forEach((doc) => groupsById.set(doc.id, { id: doc.id, ...doc.data() }));
      }
  
      state.groups = [...groupsById.values()]
        .filter((group) => isLeaderOfGroup(group, state.user.uid) || isMemberOfGroup(group, state.user.uid))
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"));
      renderGroups();
  
      if (state.groups.length) {
        const requestedGroupId = new URLSearchParams(window.location.search).get("group");
        const firstGroup = state.groups.find((group) => String(group.id) === String(requestedGroupId)) || state.groups[0];
        selectGroup(firstGroup.id);
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
        const database = firebase.firestore();
        const senderName = state.profile?.name || state.user.displayName || state.user.email || (isLeaderOfGroup(state.selected, state.user.uid) ? "CS Leader" : "CS thành viên");
        const messageRef = database.collection(GROUPS).doc(state.selected.id).collection(MESSAGE_COLLECTION).doc();
        const recipients = memberList(state.selected).filter((member) => String(member.uid) !== String(state.user.uid));
        const batch = database.batch();
        batch.set(messageRef, {
          senderUid: state.user.uid,
          senderName,
          senderEmail: state.user.email || "",
          senderType: isLeaderOfGroup(state.selected, state.user.uid) ? "cs_leader" : "cs_member",
          text,
          message: text,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        recipients.forEach((member) => {
          const notificationRef = database.collection("csNotifications").doc(member.uid).collection("items").doc();
          batch.set(notificationRef, {
            type: "group_message",
            recipientUid: member.uid,
            groupId: state.selected.id,
            groupName: state.selected.name || "Nhóm CS",
            messageId: messageRef.id,
            title: `Tin nhắn mới trong ${state.selected.name || "nhóm CS"}`,
            preview: `${senderName}: ${text.slice(0, 140)}`,
            link: isLeaderOfGroup(state.selected, member.uid) ? `/CS/Groups/group.html?group=${encodeURIComponent(state.selected.id)}` : `/CS/Groups/group-member.html?group=${encodeURIComponent(state.selected.id)}`,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
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
      state.isBooted = true;
      $("currentUserChip").textContent = state.profile.name || state.user.email || (state.profile.isLeader ? "CS Leader" : "CS thành viên");
      loadMemberGroups().catch((error) => {
        console.error("Không thể tải nhóm CS con:", error);
        $("chatEmpty").hidden = false;
        $("chatEmpty").innerHTML = '<div class="empty-mark">CS</div><h2>Không thể tải nhóm</h2><p>Vui lòng kiểm tra kết nối hoặc quyền truy cập Firebase rồi thử lại.</p>';
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
  
