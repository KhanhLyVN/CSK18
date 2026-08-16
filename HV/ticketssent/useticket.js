import { useEffect, useState } from "react";
import { db, firebaseClient, serverTimestamp, storage } from "@/lib/firebase";
import { toMillis } from "@/lib/data";
export function useOwnTickets(uid) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!uid || !db) {
      setTickets([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsubscribe = db
      .collection("tickets")
      .where("studentId", "==", uid)
      .onSnapshot(
        (snapshot) => {
          const nextTickets = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
          setTickets(nextTickets);
          setLoading(false);
          setError(null);
        },
        () => {
          setError("Không thể tải danh sách ticket lúc này.");
          setLoading(false);
        }
      );
    return unsubscribe;
  }, [uid]);
  return { tickets, loading, error };
}
export function useTicketMessages(ticketId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(ticketId));
  useEffect(() => {
    if (!ticketId || !db) {
      setMessages([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsubscribe = db
      .collection("tickets")
      .doc(ticketId)
      .collection("messages")
      .onSnapshot(
        (snapshot) => {
          const nextMessages = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
          setMessages(nextMessages);
          setLoading(false);
        },
        () => setLoading(false)
      );
    return unsubscribe;
  }, [ticketId]);
  return { messages, loading };
}
async function makeFirestoreImageFallback(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc ảnh đính kèm."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Ảnh đính kèm không hợp lệ."));
      image.onload = () => {
        const maxEdge = 1200;
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL("image/jpeg", 0.72);
        if (url.length > 850_000) {
          reject(new Error("Ảnh quá lớn để lưu tạm trên Firestore. Hãy bật Firebase Storage hoặc chọn ảnh nhỏ hơn."));
          return;
        }
        resolve({
          url,
          name: file.name,
          type: "image/jpeg",
          size: Math.round(url.length * 0.75),
          storageMode: "firestore",
        });
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
export async function uploadTicketAttachment(ticketId, uid, file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Chỉ hỗ trợ tệp ảnh trong đoạn chat.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Ảnh không được vượt quá 10 MB.");
  }
  if (!storage) {
    return makeFirestoreImageFallback(file);
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const ref = storage.ref().child(`ticket-attachments/${uid}/${ticketId}/${Date.now()}-${safeName}`);
  try {
    await ref.put(file, { contentType: file.type });
    return {
      url: await ref.getDownloadURL(),
      name: file.name,
      type: file.type,
      size: file.size,
      storageMode: "storage",
    };
  } catch {
    return makeFirestoreImageFallback(file);
  }
}
export async function sendTicketMessage(ticketId, uid, text, senderName, file = null) {
  if (!db) {
    throw new Error("Firestore chưa được khởi tạo.");
  }
  const attachment = file
    ? await uploadTicketAttachment(ticketId, uid, file)
    : null;
  const message = {
    sender: "student",
    senderType: "student",
    senderId: uid,
    senderName,
    message: text,
    text,
    attachmentUrl: attachment?.url || "",
    attachmentName: attachment?.name || "",
    attachmentType: attachment?.type || "",
    attachmentSize: attachment?.size || 0,
    createdAt: serverTimestamp(),
  };
  const ticketRef = db.collection("tickets").doc(ticketId);
  const ticketUpdate = {
    updatedAt: serverTimestamp(),
    lastMessage: text || (attachment ? `Đã gửi ảnh: ${attachment.name}` : ""),
  };
  const increment = firebaseClient?.firestore?.FieldValue?.increment?.(1);
  if (increment) {
    ticketUpdate.studentMessageCount = increment;
  }
  const batch = db.batch();
  batch.set(ticketRef.collection("messages").doc(), message);
  batch.set(ticketRef, ticketUpdate, { merge: true });
  await batch.commit();
  return attachment;
}
