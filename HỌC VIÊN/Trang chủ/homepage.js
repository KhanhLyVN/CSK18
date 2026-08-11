document.addEventListener("DOMContentLoaded", () => {
    const openTicketsEl = document.getElementById("openTicketsCount");
    
    if (typeof db !== "undefined" && openTicketsEl) {
      // Lắng nghe dữ liệu collection "tickets" từ Firestore
      db.collection("tickets").onSnapshot(
        (snapshot) => {
          let openCount = 0;
          
          snapshot.forEach((doc) => {
            const ticketData = doc.data();
            // Kiểm tra điều kiện ticket đang mở (ví dụ: trạng thái khác "closed")
            if (ticketData.status && ticketData.status !== "closed") {
              openCount++;
            }
          });
          
          // Cập nhật số lượng lên giao diện trang chủ
          openTicketsEl.textContent = openCount;
        },
        (error) => {
          console.error("Lỗi khi tải số lượng ticket:", error);
          openTicketsEl.textContent = "0";
        }
      );
    }
  });


  document.addEventListener("DOMContentLoaded", () => {
    const completedTicketsEl = document.getElementById("completedTicketsCount");
    
    if (typeof db !== "undefined" && completedTicketsEl) {
      // Lắng nghe dữ liệu collection "tickets" từ Firestore
      db.collection("tickets").onSnapshot(
        (snapshot) => {
          let completedCount = 0;
          
          snapshot.forEach((doc) => {
            const ticketData = doc.data();
            // Đếm các ticket có trạng thái là "closed" (Đã đóng / đã xử lý xong)
            if (ticketData.status === "closed") {
              completedCount++;
            }
          });
          
          // Cập nhật số lượng lên giao diện trang chủ
          completedTicketsEl.textContent = completedCount;
        },
        (error) => {
          console.error("Lỗi khi tải số lượng ticket đã hoàn thành:", error);
          completedTicketsEl.textContent = "0";
        }
      );
    }
  });