/* Automatic ticket priority classifier shared by student and CS forms. */
(function (global) {
    "use strict";
  
    const HIGH_ISSUES = new Set([
      "system-login",
      "system-account",
      "system-website-access",
      "system-page-error",
      "system-security",
      "system-data-sync",
      "learning-refund",
      "learning-payment-confirmation",
      "operations-mentor",
      "operations-mentor-feedback",
      "operations-classroom"
    ]);
  
    const LOW_ISSUES = new Set([
      "learning-promotion",
      "learning-certificate",
      "learning-other",
      "operations-material",
      "operations-other",
      "other-feedback",
      "other-request",
      "other-complaint"
    ]);
  
    const URGENT_WORDS = [
      "khẩn cấp", "khẩn", "ngay lập tức", "hôm nay", "deadline", "sắp thi",
      "mất quyền truy cập", "không thể đăng nhập", "tài khoản bị khóa", "bị hack",
      "lộ mật khẩu", "thanh toán lỗi", "đã thanh toán", "không truy cập được",
      "toàn bộ lớp", "tất cả học viên", "không hoạt động"
    ];
  
    const ELEVATED_WORDS = [
      "gấp", "sớm", "lỗi", "sai", "không xem được", "không tải được", "không nhận được",
      "trễ", "chậm", "sai thông tin", "khiếu nại", "hoàn tiền", "hủy"
    ];
  
    function normalize(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .toLowerCase()
        .trim();
    }
  
    function automaticPriority(input = {}) {
      const categoryId = normalize(input.categoryId || input.category || "other");
      const issueId = normalize(input.issueId || input.issue || "");
      const text = normalize(`${input.title || ""} ${input.description || ""}`);
      let level = "medium";
      let reason = "Mức ưu tiên mặc định theo nhóm yêu cầu.";
  
      if (HIGH_ISSUES.has(issueId)) {
        level = "high";
        reason = "Mục yêu cầu có khả năng ảnh hưởng trực tiếp đến quyền truy cập, thanh toán hoặc hoạt động học tập.";
      } else if (LOW_ISSUES.has(issueId)) {
        level = "low";
        reason = "Mục yêu cầu mang tính góp ý, thông tin hoặc không cần xử lý khẩn cấp.";
      } else if (categoryId === "system") {
        level = "medium";
        reason = "Sự cố hệ thống cần được kiểm tra nhưng chưa có dấu hiệu khẩn cấp.";
      } else if (categoryId === "learning") {
        level = "medium";
        reason = "Yêu cầu liên quan đến khóa học cần được xử lý theo quy trình hỗ trợ.";
      } else if (categoryId === "account") {
        level = "medium";
        reason = "Yêu cầu vận hành cần được bộ phận phụ trách tiếp nhận.";
      } else {
        level = "low";
        reason = "Yêu cầu khác chưa có dấu hiệu ảnh hưởng nghiêm trọng.";
      }
  
      if (URGENT_WORDS.some(word => text.includes(word))) {
        level = "high";
        reason = "Nội dung có từ khóa thể hiện mức độ khẩn cấp hoặc ảnh hưởng diện rộng.";
      } else if (level === "low" && ELEVATED_WORDS.some(word => text.includes(word))) {
        level = "medium";
        reason = "Nội dung có từ khóa cho thấy cần xử lý sớm hơn yêu cầu thông thường.";
      }
  
      return {
        level,
        label: level === "high" ? "Cao" : level === "low" ? "Thấp" : "Trung bình",
        reason,
        source: "automatic"
      };
    }
  
    global.automaticTicketPriority = automaticPriority;
  })(window);
  