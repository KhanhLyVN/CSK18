"use strict";

/* =========================================================
   CS CHAT GLOBAL
   =========================================================
   DÙNG CHUNG CHO:

   - Admin
   - CS Leader
   - CS
   - Các trang khác có navbar chung

   FIRESTORE:

   chats/{roomId}
      participants
      participantIds
      participantNames
      lastMessage
      lastMessageBy
      lastMessageSenderId
      lastMessageReadBy
      lastMessageReadAt
      createdAt
      updatedAt

   chats/{roomId}/messages/{messageId}
      from
      to
      senderId
      senderUID
      senderName
      receiverId
      receiverUID
      receiverName
      text
      message
      createdAt
      timestamp
      read
      readAt
========================================================= */

(function () {

  if (window.__CS_GLOBAL_CHAT_LOADED__) {
    console.warn(
      "[CS CHAT] cs-chat.js đã được load trước đó."
    );
    return;
  }

  window.__CS_GLOBAL_CHAT_LOADED__ = true;

  console.log(
    "[CS CHAT] Global chat loading..."
  );

  /* =====================================================
     STATE
  ===================================================== */

  const state = {

    currentUser: null,

    currentUserData: null,

    users: [],

    selectedUser: null,

    roomId: null,

    messagesUnsubscribe: null,

    roomsUnsubscribe: null,

    authUnsubscribe: null,

    initialized: false,

    eventsBound: false,

    starting: false,

    sending: false

  };


  /* =====================================================
     FIREBASE
  ===================================================== */

  function getFirebase() {

    if (
      window.CS_FIREBASE &&
      window.CS_FIREBASE.firebase
    ) {
      return window.CS_FIREBASE.firebase;
    }

    if (window.firebase) {
      return window.firebase;
    }

    return null;
  }


  function getAuth() {

    try {

      if (
        window.CS_FIREBASE &&
        window.CS_FIREBASE.auth
      ) {
        return window.CS_FIREBASE.auth;
      }

      const fb = getFirebase();

      if (
        fb &&
        typeof fb.auth === "function"
      ) {
        return fb.auth();
      }

    } catch (error) {

      console.error(
        "[CS CHAT] getAuth error:",
        error
      );

    }

    return null;
  }


  function getDB() {

    try {

      if (
        window.CS_FIREBASE &&
        window.CS_FIREBASE.db
      ) {
        return window.CS_FIREBASE.db;
      }

      const fb = getFirebase();

      if (
        fb &&
        typeof fb.firestore === "function"
      ) {
        return fb.firestore();
      }

    } catch (error) {

      console.error(
        "[CS CHAT] getDB error:",
        error
      );

    }

    return null;
  }


  function serverTimestamp() {

    const fb = getFirebase();

    try {

      if (
        fb &&
        fb.firestore &&
        fb.firestore.FieldValue &&
        fb.firestore.FieldValue.serverTimestamp
      ) {
        return fb.firestore.FieldValue.serverTimestamp();
      }

    } catch (error) {}

    return new Date();
  }


  /* =====================================================
     DOM HELPERS
  ===================================================== */

  function $(selector, root = document) {

    try {
      return root.querySelector(selector);
    } catch (error) {
      return null;
    }

  }


  function escapeHTML(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value == null
        ? ""
        : String(value);

    return div.innerHTML;

  }


  /* =====================================================
     USER HELPERS
  ===================================================== */

  function getUserName(user) {

    if (!user) {
      return "Người dùng";
    }

    return String(

      user.displayName ||

      user.name ||

      user.fullName ||

      user.full_name ||

      user.username ||

      user.email ||

      "Người dùng"

    ).trim();

  }


  function getUserEmail(user) {

    return String(
      user?.email || ""
    ).trim();

  }


  function getUserRole(user) {

    return String(

      user?.role ||

      user?.accountType ||

      user?.account_type ||

      user?.position ||

      "Thành viên"

    ).trim();

  }


  function getInitials(name) {

    const text =
      String(name || "U").trim();

    if (!text) {
      return "U";
    }

    const parts =
      text.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {

      return parts[0]
        .substring(0, 2)
        .toUpperCase();

    }

    return (

      parts[0][0] +

      parts[parts.length - 1][0]

    ).toUpperCase();

  }


  function timestampValue(value) {

    if (!value) {
      return 0;
    }

    if (
      typeof value.toMillis ===
      "function"
    ) {
      return value.toMillis();
    }

    if (
      typeof value.toDate ===
      "function"
    ) {
      return value.toDate().getTime();
    }

    if (
      typeof value.seconds ===
      "number"
    ) {
      return value.seconds * 1000;
    }

    if (
      typeof value._seconds ===
      "number"
    ) {
      return value._seconds * 1000;
    }

    if (
      value instanceof Date
    ) {
      return value.getTime();
    }

    const parsed =
      Date.parse(value);

    return Number.isNaN(parsed)
      ? 0
      : parsed;

  }


  /* =====================================================
     ROOM ID
  ===================================================== */

  function makeRoomId(uidA, uidB) {

    const ids = [

      String(uidA || ""),

      String(uidB || "")

    ]

      .filter(Boolean)

      .sort();

    if (ids.length !== 2) {
      return "";
    }

    return `${ids[0]}_${ids[1]}`;

  }


  /* =====================================================
     FIND NAVBAR BUTTON
  ===================================================== */

  function findChatButton() {

    return (

      document.querySelector(
        "#csNavbarMessengerBtn"
      ) ||

      document.querySelector(
        "#csChatButton"
      ) ||

      document.querySelector(
        "[data-cs-chat-button]"
      )

    );

  }


  /* =====================================================
     CREATE CHAT UI
  ===================================================== */

  function createChatUI() {

    const button =
      findChatButton();

    if (!button) {
      return false;
    }


    let panel =
      document.querySelector(
        "#csNavbarMessengerPanel"
      );


    if (!panel) {

      panel =
        document.createElement("aside");

      panel.id =
        "csNavbarMessengerPanel";

      panel.className =
        "cs-navbar-messenger-panel";

      panel.hidden = true;

      panel.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.appendChild(panel);

    }


    if (
      document.querySelector(
        "#csSingleChatContainer"
      )
    ) {

      return true;

    }


    const container =
      document.createElement("div");

    container.id =
      "csSingleChatContainer";


    container.innerHTML = `

      <div
        class="cs-single-chat-list"
        id="csSingleChatList"
      >

        <div class="cs-single-chat-header">

          <strong>Tin nhắn</strong>

          <button
            type="button"
            id="csSingleChatClose"
          >
            ×
          </button>

        </div>


        <div class="cs-single-chat-search">

          <input
            id="csSingleChatSearch"
            type="search"
            placeholder="Tìm tên hoặc email..."
            autocomplete="off"
          >

        </div>


        <div
          id="csSingleChatUsers"
          class="cs-single-chat-users"
        >

          <div class="cs-single-chat-loading">
            Đang tải...
          </div>

        </div>

      </div>


      <div
        class="cs-single-chat-conversation"
        id="csSingleChatConversation"
        hidden
      >

        <div class="cs-single-chat-header">

          <button
            type="button"
            id="csSingleChatBack"
          >
            ←
          </button>


          <div
            class="cs-single-chat-avatar"
            id="csSingleChatAvatar"
          >
            U
          </div>


          <div>

            <strong id="csSingleChatName">
              Trò chuyện
            </strong>

            <small id="csSingleChatRole">
              Thành viên
            </small>

          </div>

        </div>


        <div
          id="csSingleChatMessages"
          class="cs-single-chat-messages"
        >

          <div class="cs-single-chat-empty">
            Hãy gửi tin nhắn đầu tiên.
          </div>

        </div>


        <form
          id="csSingleChatForm"
          class="cs-single-chat-form"
        >

          <textarea
            id="csSingleChatInput"
            rows="1"
            maxlength="2000"
            placeholder="Nhập tin nhắn..."
            required
          ></textarea>


          <button
            type="submit"
            id="csSingleChatSend"
          >
            Gửi
          </button>

        </form>

      </div>

    `;


    panel.appendChild(container);

    return true;

  }


  /* =====================================================
     ELEMENTS
  ===================================================== */

  function getElements() {

    return {

      button:
        findChatButton(),

      panel:
        document.querySelector(
          "#csNavbarMessengerPanel"
        ),

      list:
        document.querySelector(
          "#csSingleChatList"
        ),

      users:
        document.querySelector(
          "#csSingleChatUsers"
        ),

      search:
        document.querySelector(
          "#csSingleChatSearch"
        ),

      conversation:
        document.querySelector(
          "#csSingleChatConversation"
        ),

      close:
        document.querySelector(
          "#csSingleChatClose"
        ),

      back:
        document.querySelector(
          "#csSingleChatBack"
        ),

      avatar:
        document.querySelector(
          "#csSingleChatAvatar"
        ),

      name:
        document.querySelector(
          "#csSingleChatName"
        ),

      role:
        document.querySelector(
          "#csSingleChatRole"
        ),

      messages:
        document.querySelector(
          "#csSingleChatMessages"
        ),

      form:
        document.querySelector(
          "#csSingleChatForm"
        ),

      input:
        document.querySelector(
          "#csSingleChatInput"
        ),

      send:
        document.querySelector(
          "#csSingleChatSend"
        )

    };

  }


  /* =====================================================
     LOAD CURRENT USER DATA
  ===================================================== */

  async function loadCurrentUserData() {

    const db =
      getDB();

    const user =
      state.currentUser;

    if (
      !db ||
      !user
    ) {
      return null;
    }


    try {

      const doc =
        await db
          .collection("users")
          .doc(user.uid)
          .get();


      if (
        doc.exists
      ) {

        state.currentUserData = {

          uid: user.uid,

          ...doc.data()

        };

      } else {

        state.currentUserData = {

          uid: user.uid,

          email: user.email || "",

          name:
            user.displayName ||
            user.email ||
            "Người dùng"

        };

      }


      return state.currentUserData;

    } catch (error) {

      console.warn(
        "[CS CHAT] Không đọc được users/current:",
        error
      );

      state.currentUserData = {

        uid: user.uid,

        email: user.email || "",

        name:
          user.displayName ||
          user.email ||
          "Người dùng"

      };

      return state.currentUserData;

    }

  }


  /* =====================================================
     LOAD USERS
  ===================================================== */

  async function loadUsers() {

    const db =
      getDB();

    const currentUser =
      state.currentUser;

    const elements =
      getElements();


    if (
      !db ||
      !currentUser ||
      !elements.users
    ) {

      return;

    }


    elements.users.innerHTML = `

      <div class="cs-single-chat-loading">
        Đang tải danh sách...
      </div>

    `;


    try {

      const snapshot =
        await db
          .collection("users")
          .get();


      const users = [];


      snapshot.forEach(
        (doc) => {

          const data =
            doc.data() || {};


          const uid =
            String(

              data.uid ||

              data.userId ||

              doc.id

            );


          if (
            !uid ||
            uid ===
              String(
                currentUser.uid
              )
          ) {

            return;

          }


          users.push({

            uid,

            id: uid,

            ...data

          });

        }
      );


      state.users =
        users.sort(
          (a, b) =>
            getUserName(a).localeCompare(
              getUserName(b),
              "vi"
            )
        );


      renderUsers();


    } catch (error) {

      console.error(
        "[CS CHAT] LOAD USERS ERROR:",
        error
      );


      elements.users.innerHTML = `

        <div class="cs-single-chat-error">

          Không tải được danh sách người dùng.

          <br>

          <small>
            ${escapeHTML(
              error.message || ""
            )}
          </small>

        </div>

      `;

    }

  }


  /* =====================================================
     RENDER USERS
  ===================================================== */

  function renderUsers() {

    const elements =
      getElements();


    if (
      !elements.users
    ) {
      return;
    }


    const keyword =
      String(
        elements.search?.value || ""
      )
        .trim()
        .toLowerCase();


    const users =
      state.users.filter(
        (user) => {

          if (!keyword) {
            return true;
          }


          const name =
            getUserName(user)
              .toLowerCase();


          const email =
            getUserEmail(user)
              .toLowerCase();


          return (

            name.includes(keyword) ||

            email.includes(keyword)

          );

        }
      );


    if (!users.length) {

      elements.users.innerHTML = `

        <div class="cs-single-chat-empty">
          Không tìm thấy người dùng.
        </div>

      `;

      return;

    }


    elements.users.innerHTML =

      users
        .map(
          (user) => {

            const name =
              getUserName(user);

            const email =
              getUserEmail(user);


            return `

              <button
                type="button"
                class="cs-single-chat-user"
                data-chat-user="${escapeHTML(
                  user.uid
                )}"
              >

                <span
                  class="cs-single-chat-avatar"
                >
                  ${escapeHTML(
                    getInitials(name)
                  )}
                </span>


                <span
                  class="cs-single-chat-user-info"
                >

                  <strong>
                    ${escapeHTML(name)}
                  </strong>

                  <small>
                    ${escapeHTML(
                      email ||
                      getUserRole(user)
                    )}
                  </small>

                </span>

              </button>

            `;

          }
        )
        .join("");

  }


  /* =====================================================
     OPEN PANEL
  ===================================================== */

  async function openPanel() {

    const elements =
      getElements();


    if (!elements.panel) {

      createChatUI();

    }


    const now =
      getElements();


    if (!now.panel) {
      return;
    }


    now.panel.hidden = false;

    now.panel.setAttribute(
      "aria-hidden",
      "false"
    );


    if (
      !state.currentUser
    ) {

      console.warn(
        "[CS CHAT] Chưa đăng nhập."
      );

      return;

    }


    await loadUsers();

  }


  /* =====================================================
     CLOSE PANEL
  ===================================================== */

  function closePanel() {

    const elements =
      getElements();


    if (
      elements.panel
    ) {

      elements.panel.hidden = true;

      elements.panel.setAttribute(
        "aria-hidden",
        "true"
      );

    }


    closeConversation();

  }


  /* =====================================================
     OPEN CONVERSATION
  ===================================================== */

  async function openConversation(uid) {

    const db =
      getDB();

    const currentUser =
      state.currentUser;


    if (
      !db ||
      !currentUser
    ) {

      console.error(
        "[CS CHAT] Firebase/Auth chưa sẵn sàng."
      );

      return;

    }


    const target =
      state.users.find(
        (user) =>
          String(user.uid) ===
          String(uid)
      );


    if (!target) {

      console.error(
        "[CS CHAT] Không tìm thấy user:",
        uid
      );

      return;

    }


    stopMessageListener();


    state.selectedUser =
      target;


    const roomId =
      makeRoomId(
        currentUser.uid,
        target.uid
      );


    if (!roomId) {

      console.error(
        "[CS CHAT] Không tạo được roomId."
      );

      return;

    }


    state.roomId =
      roomId;


    const elements =
      getElements();


    if (
      !elements.conversation
    ) {
      return;
    }


    if (elements.list) {
      elements.list.hidden = true;
    }


    elements.conversation.hidden =
      false;


    if (elements.name) {

      elements.name.textContent =
        getUserName(target);

    }


    if (elements.role) {

      elements.role.textContent =
        getUserRole(target);

    }


    if (elements.avatar) {

      elements.avatar.textContent =
        getInitials(
          getUserName(target)
        );

    }


    if (elements.messages) {

      elements.messages.innerHTML = `

        <div class="cs-single-chat-loading">
          Đang tải tin nhắn...
        </div>

      `;

    }


    const roomRef =
      db
        .collection("chats")
        .doc(roomId);


    try {

      const roomSnapshot =
        await roomRef.get();


      if (
        !roomSnapshot.exists
      ) {

        await roomRef.set({

          participants: [

            currentUser.uid,

            target.uid

          ],


          participantIds: [

            currentUser.uid,

            target.uid

          ],


          participantNames: {

            [currentUser.uid]:
              getUserName(
                state.currentUserData ||
                currentUser
              ),

            [target.uid]:
              getUserName(target)

          },


          lastMessage: "",

          lastMessageBy: "",

          lastMessageSenderId: "",

          lastMessageReadBy: "",

          lastMessageReadAt: null,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        });

      }


      await markRoomRead(
        roomId
      );


    } catch (error) {

      console.error(
        "[CS CHAT] ROOM ERROR:",
        error
      );

      if (elements.messages) {

        elements.messages.innerHTML = `

          <div class="cs-single-chat-error">

            Không thể mở cuộc trò chuyện.

            <br>

            <small>
              ${escapeHTML(
                error.message || ""
              )}
            </small>

          </div>

        `;

      }

      return;

    }


    listenMessages(
      roomId
    );

  }


  /* =====================================================
     LISTEN MESSAGES
  ===================================================== */

  function listenMessages(roomId) {

    const db =
      getDB();

    const elements =
      getElements();


    if (
      !db ||
      !roomId ||
      !elements.messages
    ) {
      return;
    }


    stopMessageListener();


    const messagesRef =
      db
        .collection("chats")
        .doc(roomId)
        .collection("messages");


    /*
       KHÔNG dùng orderBy.

       Lý do:
       Dữ liệu cũ của bé có thể không đồng nhất
       giữa createdAt/timestamp.

       Vì vậy lấy toàn bộ messages
       rồi sort bằng JS.
    */


    state.messagesUnsubscribe =
      messagesRef.onSnapshot(

        (snapshot) => {

          const messages =
            snapshot.docs.map(
              (doc) => ({

                id: doc.id,

                ...doc.data()

              })
            );


          renderMessages(
            messages
          );


          /*
             Chỉ đánh dấu đọc khi đang mở đúng room.
          */

          if (
            state.roomId === roomId
          ) {

            markRoomRead(
              roomId
            );

          }

        },


        (error) => {

          console.error(
            "[CS CHAT] MESSAGE LISTENER ERROR:",
            error
          );


          if (
            elements.messages
          ) {

            elements.messages.innerHTML = `

              <div class="cs-single-chat-error">

                Không thể tải tin nhắn.

                <br>

                <small>
                  ${escapeHTML(
                    error.message || ""
                  )}
                </small>

              </div>

            `;

          }

        }

      );

  }


  /* =====================================================
     STOP MESSAGE LISTENER
  ===================================================== */

  function stopMessageListener() {

    if (
      typeof state.messagesUnsubscribe ===
      "function"
    ) {

      try {

        state.messagesUnsubscribe();

      } catch (error) {}

    }


    state.messagesUnsubscribe =
      null;

  }


  /* =====================================================
     RENDER MESSAGES
  ===================================================== */

  function renderMessages(messages) {

    const elements =
      getElements();

    const currentUser =
      state.currentUser;


    if (
      !elements.messages ||
      !currentUser
    ) {
      return;
    }


    messages.sort(
      (a, b) => {

        const ta =
          timestampValue(
            a.createdAt ||
            a.timestamp
          );

        const tb =
          timestampValue(
            b.createdAt ||
            b.timestamp
          );

        return ta - tb;

      }
    );


    if (!messages.length) {

      elements.messages.innerHTML = `

        <div class="cs-single-chat-empty">
          Hãy gửi tin nhắn đầu tiên.
        </div>

      `;

      return;

    }


    elements.messages.innerHTML =

      messages
        .map(
          (message) => {

            const senderId =
              String(

                message.senderId ||

                message.senderUID ||

                message.from ||

                ""

              );


            const isMine =
              senderId ===
              String(
                currentUser.uid
              );


            const text =
              message.text ||

              message.message ||

              message.content ||

              "";


            const time =
              timestampValue(
                message.createdAt ||
                message.timestamp
              );


            let timeText = "";


            if (time) {

              try {

                timeText =
                  new Date(time)
                    .toLocaleTimeString(
                      "vi-VN",
                      {
                        hour: "2-digit",
                        minute: "2-digit"
                      }
                    );

              } catch (error) {}

            }


            return `

              <div
                class="
                  cs-single-chat-message
                  ${isMine ? "mine" : "other"}
                "
              >

                <div
                  class="cs-single-chat-bubble"
                >

                  ${escapeHTML(text)}

                  ${
                    timeText
                      ? `
                        <small
                          class="cs-single-chat-time"
                        >
                          ${escapeHTML(
                            timeText
                          )}
                        </small>
                      `
                      : ""
                  }

                </div>

              </div>

            `;

          }
        )
        .join("");


    elements.messages.scrollTop =
      elements.messages.scrollHeight;

  }


  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  async function sendMessage(event) {

    if (event) {
      event.preventDefault();
    }


    if (state.sending) {
      return;
    }


    const db =
      getDB();

    const currentUser =
      state.currentUser;

    const target =
      state.selectedUser;

    const roomId =
      state.roomId;

    const elements =
      getElements();


    if (
      !db ||
      !currentUser ||
      !target ||
      !roomId ||
      !elements.input
    ) {

      console.error(
        "[CS CHAT] Thiếu dữ liệu gửi."
      );

      return;

    }


    const text =
      String(
        elements.input.value || ""
      ).trim();


    if (!text) {
      return;
    }


    state.sending =
      true;


    if (elements.send) {

      elements.send.disabled =
        true;

    }


    try {

      const roomRef =
        db
          .collection("chats")
          .doc(roomId);


      const messagesRef =
        roomRef.collection(
          "messages"
        );


      const now =
        serverTimestamp();


      /*
         Dùng transaction để
         cập nhật room an toàn.
      */

      await roomRef.set(

        {

          participants: [

            currentUser.uid,

            target.uid

          ],


          participantIds: [

            currentUser.uid,

            target.uid

          ],


          participantNames: {

            [currentUser.uid]:
              getUserName(
                state.currentUserData ||
                currentUser
              ),

            [target.uid]:
              getUserName(target)

          },


          lastMessage:
            text,

          lastMessageBy:
            currentUser.uid,

          lastMessageSenderId:
            currentUser.uid,

          lastMessageReadBy:
            currentUser.uid,

          lastMessageReadAt:
            now,

          updatedAt:
            now

        },

        {
          merge: true
        }

      );


      /*
         Tạo message.

         QUAN TRỌNG:
         Dùng cùng roomId.
      */

      await messagesRef.add({

        from:
          currentUser.uid,

        to:
          target.uid,

        senderId:
          currentUser.uid,

        senderUID:
          currentUser.uid,

        senderName:
          getUserName(
            state.currentUserData ||
            currentUser
          ),

        receiverId:
          target.uid,

        receiverUID:
          target.uid,

        receiverName:
          getUserName(target),

        text:
          text,

        message:
          text,

        createdAt:
          now,

        timestamp:
          now,

        read:
          false

      });


      elements.input.value =
        "";


      elements.input.focus();


      console.log(
        "[CS CHAT] MESSAGE SENT",
        {
          roomId,
          sender:
            currentUser.uid,
          receiver:
            target.uid
        }
      );


    } catch (error) {

      console.error(
        "[CS CHAT] SEND ERROR:",
        error
      );


      alert(
        "Không gửi được tin nhắn:\n" +
        (
          error.message ||
          "Firestore error"
        )
      );


    } finally {

      state.sending =
        false;


      if (elements.send) {

        elements.send.disabled =
          false;

      }

    }

  }


  /* =====================================================
     MARK READ
  ===================================================== */

  async function markRoomRead(roomId) {

    const db =
      getDB();

    const currentUser =
      state.currentUser;


    if (
      !db ||
      !currentUser ||
      !roomId
    ) {
      return;
    }


    try {

      const messagesRef =
        db
          .collection("chats")
          .doc(roomId)
          .collection("messages");


      const snapshot =
        await messagesRef.get();


      const batch =
        db.batch();


      let changed =
        false;


      snapshot.forEach(
        (doc) => {

          const data =
            doc.data() || {};


          const receiverId =
            String(

              data.receiverId ||

              data.receiverUID ||

              data.to ||

              ""

            );


          const senderId =
            String(

              data.senderId ||

              data.senderUID ||

              data.from ||

              ""

            );


          if (

            receiverId ===
              String(
                currentUser.uid
              ) &&

            senderId !==
              String(
                currentUser.uid
              ) &&

            data.read !== true

          ) {

            batch.update(
              doc.ref,
              {

                read: true,

                readAt:
                  serverTimestamp()

              }
            );


            changed =
              true;

          }

        }
      );


      if (changed) {

        await batch.commit();

      }


      /*
         Chỉ update lastMessageRead*
         nếu đây là room đang mở.
      */

      if (
        state.roomId === roomId
      ) {

        await db
          .collection("chats")
          .doc(roomId)
          .set(

            {

              lastMessageReadBy:
                currentUser.uid,

              lastMessageReadAt:
                serverTimestamp()

            },

            {
              merge: true
            }

          );

      }


    } catch (error) {

      console.warn(
        "[CS CHAT] MARK READ ERROR:",
        error
      );

    }

  }


  /* =====================================================
     UNREAD
  ===================================================== */

  function bindUnread() {

    const db =
      getDB();

    const currentUser =
      state.currentUser;


    if (
      !db ||
      !currentUser
    ) {
      return;
    }


    if (
      typeof state.roomsUnsubscribe ===
      "function"
    ) {

      state.roomsUnsubscribe();

    }


    /*
       Không where.
       Không orderBy.
       Không composite index.
    */

    state.roomsUnsubscribe =
      db
        .collection("chats")
        .onSnapshot(

          (snapshot) => {

            let unread =
              0;


            snapshot.forEach(
              (doc) => {

                const data =
                  doc.data() || {};


                const participants = [

                  ...(Array.isArray(
                    data.participants
                  )
                    ? data.participants
                    : []),

                  ...(Array.isArray(
                    data.participantIds
                  )
                    ? data.participantIds
                    : [])

                ].map(String);


                if (
                  !participants.includes(
                    String(
                      currentUser.uid
                    )
                  )
                ) {

                  return;

                }


                const sender =
                  String(

                    data.lastMessageBy ||

                    data.lastMessageSenderId ||

                    ""

                  );


                const readBy =
                  String(
                    data.lastMessageReadBy ||
                    ""
                  );


                if (

                  data.lastMessage &&

                  sender !==
                    String(
                      currentUser.uid
                    ) &&

                  readBy !==
                    String(
                      currentUser.uid
                    )

                ) {

                  unread++;

                }

              }
            );


            updateBadge(
              unread
            );

          },


          (error) => {

            console.warn(
              "[CS CHAT] UNREAD ERROR:",
              error
            );

          }

        );

  }


  /* =====================================================
     BADGE
  ===================================================== */

  function updateBadge(count) {

    const badges = [

      document.querySelector(
        "#csNavbarMessengerBadge"
      ),

      document.querySelector(
        "#csChatCount"
      ),

      document.querySelector(
        "[data-cs-chat-badge]"
      )

    ].filter(Boolean);


    const total =
      Math.max(
        0,
        Number(count) || 0
      );


    badges.forEach(
      (badge) => {

        badge.textContent =
          total > 99
            ? "99+"
            : String(total);


        badge.hidden =
          total === 0;

      }
    );

  }


  /* =====================================================
     EVENTS
  ===================================================== */

  function bindEvents() {

    if (
      state.eventsBound
    ) {
      return;
    }


    /*
       Dùng document delegation.

       Vì navbar có thể được inject
       sau khi cs-chat.js load.
    */


    document.addEventListener(
      "click",
      async (event) => {

        const button =
          event.target.closest(
            "#csNavbarMessengerBtn, #csChatButton, [data-cs-chat-button]"
          );


        if (button) {

          event.preventDefault();

          const elements =
            getElements();


          if (
            elements.panel &&
            !elements.panel.hidden
          ) {

            closePanel();

          } else {

            await openPanel();

          }

          return;

        }


        const userButton =
          event.target.closest(
            "[data-chat-user]"
          );


        if (userButton) {

          const uid =
            userButton.dataset.chatUser;


          if (uid) {

            await openConversation(
              uid
            );

          }

          return;

        }


        if (
          event.target.closest(
            "#csSingleChatClose"
          )
        ) {

          closePanel();

          return;

        }


        if (
          event.target.closest(
            "#csSingleChatBack"
          )
        ) {

          closeConversation();

          return;

        }

      }
    );


    document.addEventListener(
      "input",
      (event) => {

        if (
          event.target?.id ===
          "csSingleChatSearch"
        ) {

          renderUsers();

        }

      }
    );


    document.addEventListener(
      "submit",
      (event) => {

        if (
          event.target?.id ===
          "csSingleChatForm"
        ) {

          sendMessage(
            event
          );

        }

      }
    );


    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.target?.id ===
          "csSingleChatInput"
        ) {

          if (
            event.key === "Enter" &&
            !event.shiftKey
          ) {

            event.preventDefault();

            const form =
              document.querySelector(
                "#csSingleChatForm"
              );


            if (form) {

              if (
                typeof form.requestSubmit ===
                "function"
              ) {

                form.requestSubmit();

              } else {

                sendMessage({
                  preventDefault() {}
                });

              }

            }

          }

        }


        if (
          event.key === "Escape"
        ) {

          const elements =
            getElements();


          if (
            elements.panel &&
            !elements.panel.hidden
          ) {

            closePanel();

          }

        }

      }
    );


    state.eventsBound =
      true;


    console.log(
      "[CS CHAT] Global events ready."
    );

  }


  /* =====================================================
     CLOSE CONVERSATION
  ===================================================== */

  function closeConversation() {

    stopMessageListener();


    state.selectedUser =
      null;

    state.roomId =
      null;


    const elements =
      getElements();


    if (
      elements.conversation
    ) {

      elements.conversation.hidden =
        true;

    }


    if (
      elements.list
    ) {

      elements.list.hidden =
        false;

    }

  }


  /* =====================================================
     AUTH
  ===================================================== */

  function bindAuth() {

    const auth =
      getAuth();


    if (!auth) {

      console.warn(
        "[CS CHAT] Firebase Auth chưa sẵn sàng."
      );

      return false;

    }


    if (
      state.authUnsubscribe
    ) {

      try {

        state.authUnsubscribe();

      } catch (error) {}

    }


    state.authUnsubscribe =
      auth.onAuthStateChanged(
        async (user) => {

          console.log(
            "[CS CHAT] Auth:",
            user
              ? user.uid
              : "LOGOUT"
          );


          if (!user) {

            state.currentUser =
              null;

            state.currentUserData =
              null;

            state.users =
              [];

            state.selectedUser =
              null;

            state.roomId =
              null;


            stopMessageListener();


            if (
              state.roomsUnsubscribe
            ) {

              try {

                state.roomsUnsubscribe();

              } catch (error) {}

              state.roomsUnsubscribe =
                null;

            }


            updateBadge(
              0
            );


            return;

          }


          state.currentUser =
            user;


          await loadCurrentUserData();


          bindUnread();


          /*
             Nếu chat UI đã tồn tại
             thì có thể load user ngay.
          */

          if (
            document.querySelector(
              "#csSingleChatContainer"
            )
          ) {

            loadUsers();

          }

        }
      );


    return true;

  }


  /* =====================================================
     START
  ===================================================== */

  async function start() {

    if (state.starting) {
      return;
    }


    state.starting =
      true;


    try {

      bindEvents();


      /*
         Firebase có thể được load
         sau chat.js.
      */

      const auth =
        getAuth();


      if (auth) {

        bindAuth();

      } else {

        console.warn(
          "[CS CHAT] Đang chờ Firebase..."
        );

      }


      /*
         Navbar có thể được inject
         sau khi DOM ready.
      */

      createChatUI();


      console.log(
        "[CS CHAT] Global chat started."
      );


    } finally {

      state.starting =
        false;

    }

  }


  /* =====================================================
     AUTO INIT
  ===================================================== */

  function boot() {

    start();


    /*
       Kiểm tra navbar xuất hiện
       sau đó vài giây.
    */

    let count =
      0;


    const timer =
      setInterval(
        () => {

          count++;


          createChatUI();


          if (
            getAuth() &&
            !state.authUnsubscribe
          ) {

            bindAuth();

          }


          if (
            count >= 30
          ) {

            clearInterval(
              timer
            );

          }

        },
        500
      );


    /*
       Nếu navbar được render bằng JS
       MutationObserver sẽ bắt được.
    */

    if (
      window.MutationObserver
    ) {

      const observer =
        new MutationObserver(
          () => {

            if (
              !document.querySelector(
                "#csSingleChatContainer"
              )
            ) {

              createChatUI();

            }

          }
        );


      observer.observe(
        document.body,
        {
          childList: true,
          subtree: true
        }
      );


      setTimeout(
        () => {

          try {
            observer.disconnect();
          } catch (error) {}

        },
        15000
      );

    }

  }


  /* =====================================================
     PUBLIC API
  ===================================================== */

  window.csSingleChat = {

    open:
      openPanel,

    close:
      closePanel,

    reload:
      loadUsers,

    openConversation:
      openConversation,

    sendMessage:
      sendMessage,

    makeRoomId:
      makeRoomId,

    markRead:
      markRoomRead,

    getState:
      () => ({
        ...state
      })

  };


  /* =====================================================
     DOM READY
  ===================================================== */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once: true
      }
    );

  } else {

    boot();

  }


})();