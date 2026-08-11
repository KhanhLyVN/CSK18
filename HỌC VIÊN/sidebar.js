document.addEventListener("DOMContentLoaded", () => {
    const menuToggleEl = document.getElementById("menuToggle");
    const sidebarEl = document.getElementById("sidebarEl");
  
    if (menuToggleEl && sidebarEl) {
      menuToggleEl.addEventListener("click", () => {
        sidebarEl.classList.toggle("collapsed");
      });
    }
  });

document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll(".sidebar-menu .menu-item");
  
    menuItems.forEach((item) => {
      const href = item.getAttribute("href");
      
      if (href && href !== "#") {
        // Lấy tên file hiện tại từ đường dẫn (ví dụ: homepage.html hoặc trao-doi-ticket.html)
        const fileName = href.split("/").pop();
  
        // Nếu đường dẫn trang hiện tại khớp với tên file của menu item
        if (fileName && currentPath.includes(fileName)) {
          // Xóa sạch active ở các mục khác trước
          menuItems.forEach((el) => el.classList.remove("active"));
          // Giữ màu active cho mục hiện tại
          item.classList.add("active");
        }
      }
    });
  });