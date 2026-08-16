/* =========================================================
   CONFIG
========================================================= */
const TICKET_COLLECTION = "tickets";
/*
 * QUAN TRỌNG:
 *
 * Firebase của bé đang dùng:
 *
 * campus
 *
 * KHÔNG PHẢI:
 *
 * departments
 */
const CAMPUS_COLLECTION = "campus";
/*
 * Collection chứa hồ sơ user (CS, manager,...)
 * Dùng để biết CS đang đăng nhập thuộc
 * campus nào / phòng ban nào.
 */
const USER_COLLECTION = "users";
/*
 * Nếu ticket không xác định được phòng ban
 * thì mặc định chuyển về IT.
 */
const DEFAULT_DEPARTMENT_CODE = "IT";
/* =========================================================
   FIREBASE CHECK
========================================================= */
(function () {
    "use strict";
    if (
        typeof firebase === "undefined"
    ) {
        console.error(
            "❌ Firebase chưa được load."
        );
        return;
    }
    if (
        typeof db === "undefined"
    ) {
        console.error(
            "❌ Firestore db chưa được khởi tạo."
        );
        return;
    }
    if (
        typeof auth === "undefined"
    ) {
        console.error(
            "❌ Firebase Auth chưa được khởi tạo."
        );
        return;
    }
    console.log(
        "=========================================="
    );
    console.log(
        "CS DASHBOARD JS ĐÃ KHỞI ĐỘNG"
    );
    console.log(
        "Ticket collection:",
        TICKET_COLLECTION
    );
    console.log(
        "Campus collection:",
        CAMPUS_COLLECTION
    );
    console.log(
        "Default department:",
        DEFAULT_DEPARTMENT_CODE
    );
    console.log(
        "=========================================="
    );
    /* =====================================================
       ICONS
    ===================================================== */
    const ICONS = {
        bug:
            '<path d="M12 8v8M8 12h8"/>' +
            '<path d="M9 4h6l1 3H8l1-3z"/>' +
            '<rect x="6" y="7" width="12" height="12" rx="4"/>' +
            '<path d="M4 10l2 1M20 10l-2 1M4 17l2-1M20 17l-2-1"/>',
        calendar:
            '<rect x="3" y="5" width="18" height="16" rx="2"/>' +
            '<path d="M16 3v4M8 3v4M3 10h18"/>',
        wallet:
            '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/>' +
            '<path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-5a2 2 0 0 0 0 4h6"/>',
        cert:
            '<circle cx="12" cy="8" r="5"/>' +
            '<path d="M9 12.5L7 21l5-3 5 3-2-8.5"/>',
        swap:
            '<path d="M7 4v10M7 4L4 7M7 4l3 3"/>' +
            '<path d="M17 20V10M17 20l3-3M17 20l-3-3"/>',
        chat:
            '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.6-3.8A8.5 8.5 0 1 1 21 11.5z"/>' +
            '<path d="M12 9v4M12 15.5h.01"/>',
        scale:
            '<path d="M12 3v18M5 8l-3 6a4 4 0 0 0 6 0zM19 8l-3 6a4 4 0 0 0 6 0zM5 8h14M9 3h6"/>',
        mentor:
            '<circle cx="9" cy="8" r="3"/>' +
            '<path d="M4 20c0-3.3 2.7-5.5 5-5.5s5 2.2 5 5.5"/>' +
            '<path d="M15 8h6M18 5v6"/>',
        book:
            '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/>' +
            '<path d="M20 18H6.5A2.5 2.5 0 0 0 4 20.5"/>',
        other:
            '<circle cx="5" cy="12" r="1.4"/>' +
            '<circle cx="12" cy="12" r="1.4"/>' +
            '<circle cx="19" cy="12" r="1.4"/>'
    };
    function svgIcon(key) {
        return `
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                ${ICONS[key] || ICONS.other}
            </svg>
        `;
    }
    /* =====================================================
       STATUS
    ===================================================== */
    const STATUS_META = {
        open: {
            label: "Đang mở",
            color: "#B08A4E"
        },
        pending: {
            label: "Đang chờ",
            color: "#B08A4E"
        },
        in_progress: {
            label: "Đang xử lý",
            color: "#5D0703"
        },
        resolved: {
            label: "Đã giải quyết",
            color: "#4C6B3C"
        },
        closed: {
            label: "Đã đóng",
            color: "#8A7A6D"
        }
    };
    function normalizeStatus(status) {
        if (
            !status
        ) {
            return "open";
        }
        const value =
            String(status)
                .trim()
                .toLowerCase();
        if (
            value === "pending"
        ) {
            return "pending";
        }
        if (
            STATUS_META[value]
        ) {
            return value;
        }
        return "open";
    }
    function statusPill(status) {
        const key =
            normalizeStatus(status);
        const meta =
            STATUS_META[key] ||
            STATUS_META.open;
        return `
            <span
                class="status-tag"
                style="
                    background:${meta.color}22;
                    color:${meta.color};
                "
            >
                <span
                    class="dot"
                    style="
                        background:${meta.color};
                    "
                ></span>
                ${escapeHtml(meta.label)}
            </span>
        `;
    }
    /* =====================================================
       CATEGORY LABEL
    ===================================================== */
    const TICKET_CATEGORY_LABELS = {
        system: "Hệ thống",
        learning: "Khóa học",
        account: "Tài khoản",
        operations: "Vận hành",
        other: "Khác",
        "system-login":
            "Đăng nhập / xác thực",
        "system-password":
            "Mật khẩu",
        "system-account":
            "Tài khoản học viên",
        "system-website-access":
            "Website không truy cập được",
        "system-page-error":
            "Một trang bị lỗi",
        "system-browser-device":
            "Lỗi thiết bị / trình duyệt",
        "system-video-playback":
            "Lỗi phát video",
        "system-file-upload":
            "Không tải được tệp",
        "system-notification":
            "Email / thông báo",
        "system-data-sync":
            "Dữ liệu chưa đồng bộ",
        "system-security":
            "Bảo mật tài khoản",
        "system-technical":
            "Lỗi kỹ thuật / trang web",
        "system-web":
            "Website không truy cập được",
        "learning-registration":
            "Đăng ký khóa học",
        "learning-course-access":
            "Quyền truy cập khóa học",
        "learning-fee":
            "Học phí",
        "learning-payment-method":
            "Phương thức thanh toán",
        "learning-payment-confirmation":
            "Xác nhận thanh toán",
        "learning-invoice":
            "Hóa đơn / biên nhận",
        "learning-refund":
            "Hoàn tiền / hủy đăng ký",
        "learning-promotion":
            "Mã giảm giá / ưu đãi",
        "learning-certificate":
            "Chứng chỉ",
        "learning-result":
            "Kết quả học tập",
        "account-schedule":
            "Lịch học",
        "account-qualities":
            "Chất lượng hình ảnh / video",
        "account-mentor":
            "Mentor / giáo viên",
        "account-support":
            "Hỗ trợ trong quá trình học",
        "operations-schedule":
            "Lịch học",
        "operations-attendance":
            "Điểm danh và vắng học",
        "operations-mentor":
            "Mentor / giáo viên",
        "operations-mentor-feedback":
            "Phản hồi về mentor",
        "operations-video-quality":
            "Chất lượng hình ảnh / video",
        "operations-video-access":
            "Không xem được bài giảng",
        "operations-material":
            "Tài liệu và bài giảng",
        "operations-assignment":
            "Bài tập và hỗ trợ bài giảng",
        "operations-classroom":
            "Phòng học và buổi học",
        "operations-support":
            "Hỗ trợ trong quá trình học",
        "other-feedback":
            "Góp ý / phản hồi",
        "other-complaint":
            "Khiếu nại",
        "other-request":
            "Yêu cầu hỗ trợ khác"
    };
    function resolveTicketLabel(value) {
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return "Khác";
        }
        const normalized =
            String(value).trim();
        return (
            TICKET_CATEGORY_LABELS[normalized] ||
            normalized
        );
    }
    function getTicketType(ticket) {
        const category =
            resolveTicketLabel(
                ticket.ticketCategory ||
                ticket.category ||
                ""
            );
        const issue =
            resolveTicketLabel(
                ticket.ticketIssue ||
                ticket.issue ||
                ticket.detail ||
                ""
            );
        /*
         * Nếu có ticketType dạng system-web
         * thì ưu tiên lấy label của nó.
         */
        if (
            ticket.ticketType &&
            TICKET_CATEGORY_LABELS[
                ticket.ticketType
            ]
        ) {
            return TICKET_CATEGORY_LABELS[
                ticket.ticketType
            ];
        }
        if (
            issue &&
            issue !== category &&
            issue !== "Khác"
        ) {
            return `${category} · ${issue}`;
        }
        return (
            category ||
            issue ||
            "Khác"
        );
    }
    /* =====================================================
       BASIC HELPERS
    ===================================================== */
    function getTicketNum(ticket) {
        return (
            ticket.ticketNum ||
            ticket.ticket_num ||
            ticket.ticketId ||
            ticket.id ||
            "—"
        );
    }
    function getTicketTitle(ticket) {
        return (
            ticket.title ||
            ticket.subject ||
            ticket.question ||
            "Không có tiêu đề"
        );
    }
    function getStudentName(ticket) {
        return (
            ticket.name ||
            ticket.studentName ||
            ticket.fullName ||
            "Học viên"
        );
    }
    function escapeHtml(value) {
        const div =
            document.createElement("div");
        div.textContent =
            value === undefined ||
            value === null
                ? ""
                : String(value);
        return div.innerHTML;
    }
    /* =====================================================
       DATE
    ===================================================== */
    function getTimestampMillis(value) {
        if (
            !value
        ) {
            return 0;
        }
        if (
            typeof value.toMillis ===
            "function"
        ) {
            return value.toMillis();
        }
        if (
            value instanceof Date
        ) {
            return value.getTime();
        }
        if (
            typeof value.seconds ===
            "number"
        ) {
            return value.seconds * 1000;
        }
        const parsed =
            new Date(value).getTime();
        return isNaN(parsed)
            ? 0
            : parsed;
    }
    function formatTicketDate(ticket) {
        if (
            ticket.date
        ) {
            return String(
                ticket.date
            );
        }
        if (
            ticket.createdAt
        ) {
            const millis =
                getTimestampMillis(
                    ticket.createdAt
                );
            if (
                millis
            ) {
                return new Date(
                    millis
                ).toLocaleDateString(
                    "vi-VN"
                );
            }
        }
        return "—";
    }
    function todayLabel() {
        return new Date()
            .toLocaleDateString(
                "vi-VN",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );
    }
    const todayElement =
        document.getElementById(
            "todayStr"
        );
    if (
        todayElement
    ) {
        todayElement.textContent =
            todayLabel();
    }
    /* =====================================================
       GREETING
    ===================================================== */
    function greetingByHour() {
        const hour =
            new Date().getHours();
        if (
            hour < 11
        ) {
            return "Chào buổi sáng";
        }
        if (
            hour < 13
        ) {
            return "Chào buổi trưa";
        }
        if (
            hour < 18
        ) {
            return "Chào buổi chiều";
        }
        return "Chào buổi tối";
    }
    const greetingElement =
        document.getElementById(
            "greetingLine"
        );
    if (
        greetingElement
    ) {
        greetingElement.textContent =
            `${greetingByHour()} — đây là tổng quan các yêu cầu hỗ trợ từ học viên hiện có trên hệ thống.`;
    }
    /* =====================================================
       CAMPUS
    ===================================================== */
    function normalizeCampus(value) {
        if (
            value === undefined ||
            value === null
        ) {
            return "";
        }
        const campus =
            String(value).trim();
        if (
            !campus
        ) {
            return "";
        }
        const lower =
            campus.toLowerCase();
        if (
            lower === "hcm" ||
            lower === "tphcm" ||
            lower === "tp hcm" ||
            lower === "tp.hcm" ||
            lower === "tp. hcm" ||
            lower === "hồ chí minh" ||
            lower === "ho chi minh"
        ) {
            return "HCM";
        }
        if (
            lower === "hn" ||
            lower === "hà nội" ||
            lower === "ha noi"
        ) {
            return "Hà Nội";
        }
        return campus;
    }
    /* =====================================================
       CAMPUS TỪ CAMPUS ID
    ===================================================== */
    function campusFromCampusId(campusId) {
        if (
            !campusId
        ) {
            return "";
        }
        const value =
            String(campusId).trim();
        /*
         * IT-HCM
         * IT-Hà Nội
         * IT-HN
         */
        if (
            value.includes("-")
        ) {
            const parts =
                value.split("-");
            const last =
                parts[
                    parts.length - 1
                ];
            return normalizeCampus(last);
        }
        return normalizeCampus(value);
    }
    /* =====================================================
       LẤY CAMPUS TỪ TICKET
    ===================================================== */
    function getTicketCampus(ticket) {
        if (
            ticket.campus
        ) {
            return normalizeCampus(
                ticket.campus
            );
        }
        if (
            ticket.campusName
        ) {
            return normalizeCampus(
                ticket.campusName
            );
        }
        if (
            ticket.campusId
        ) {
            return campusFromCampusId(
                ticket.campusId
            );
        }
        return "";
    }
    /* =====================================================
       DEPARTMENT ROUTING
    ===================================================== */
    /*
     * Hiện tại toàn bộ ticket hệ thống
     * sẽ chuyển về IT.
     *
     * Sau này có thể thêm:
     *
     * "learning": "TEACH"
     * "operations": "TEACH"
     * ...
     */
    const DEPARTMENT_ROUTING = {
        system: "IT",
        "Hệ thống": "IT",
        "system-web": "IT",
        "system-login": "IT",
        "system-password": "IT",
        "system-account": "IT",
        "system-technical": "IT",
        learning: "IT",
        "Khóa học": "IT",
        account: "IT",
        "Tài khoản": "IT",
        operations: "IT",
        "Vận hành": "IT",
        other: "IT",
        "Khác": "IT"
    };
    function normalizeDepartmentCode(value) {
        if (
            value === undefined ||
            value === null
        ) {
            return "";
        }
        return String(value)
            .trim()
            .toUpperCase();
    }
    /* =====================================================
       RESOLVE DEPARTMENT CODE
    ===================================================== */
    function resolveDepartmentCode(ticket) {
        /*
         * 1. Ticket đã có departmentCode.
         */
        if (
            ticket.departmentCode
        ) {
            return normalizeDepartmentCode(
                ticket.departmentCode
            );
        }
        /*
         * 2. Ticket có department.
         */
        if (
            ticket.department
        ) {
            if (
                typeof ticket.department ===
                "object"
            ) {
                if (
                    ticket.department.code
                ) {
                    return normalizeDepartmentCode(
                        ticket.department.code
                    );
                }
            }
            if (
                typeof ticket.department ===
                "string"
            ) {
                const department =
                    normalizeDepartmentCode(
                        ticket.department
                    );
                if (
                    department.length <= 10
                ) {
                    return department;
                }
            }
        }
        /*
         * 3. ticketType.
         *
         * Ví dụ:
         *
         * system-web
         *
         * => IT
         */
        if (
            ticket.ticketType
        ) {
            const ticketType =
                String(
                    ticket.ticketType
                ).trim();
            if (
                DEPARTMENT_ROUTING[
                    ticketType
                ]
            ) {
                return normalizeDepartmentCode(
                    DEPARTMENT_ROUTING[
                        ticketType
                    ]
                );
            }
            /*
             * Nếu ticketType bắt đầu bằng system
             */
            if (
                ticketType
                    .toLowerCase()
                    .startsWith("system")
            ) {
                return "IT";
            }
        }
        /*
         * 4. category.
         */
        if (
            ticket.ticketCategory
        ) {
            const category =
                String(
                    ticket.ticketCategory
                ).trim();
            if (
                DEPARTMENT_ROUTING[
                    category
                ]
            ) {
                return normalizeDepartmentCode(
                    DEPARTMENT_ROUTING[
                        category
                    ]
                );
            }
        }
        /*
         * 5. Mặc định.
         */
        return normalizeDepartmentCode(
            DEFAULT_DEPARTMENT_CODE
        );
    }
    /* =====================================================
       TÌM CAMPUS DOCUMENT
    ===================================================== */
    async function findCampusDepartment(
        campus,
        departmentCode
    ) {
        const normalizedCampus =
            normalizeCampus(
                campus
            );
        const normalizedCode =
            normalizeDepartmentCode(
                departmentCode
            );
        if (
            !normalizedCampus
        ) {
            throw new Error(
                "Không xác định được campus của ticket."
            );
        }
        if (
            !normalizedCode
        ) {
            throw new Error(
                "Không xác định được departmentCode."
            );
        }
        console.log(
            "🔎 Tìm campus document:",
            {
                campus:
                    normalizedCampus,
                code:
                    normalizedCode
            }
        );
        /*
         * QUAN TRỌNG:
         *
         * Không dùng:
         *
         * where("campus", "==", ...)
         * .where("code", "==", ...)
         *
         * để tránh yêu cầu composite index.
         *
         * Chỉ query campus.
         * Sau đó lọc code bằng JavaScript.
         */
        const snapshot =
            await db
                .collection(
                    CAMPUS_COLLECTION
                )
                .where(
                    "campus",
                    "==",
                    normalizedCampus
                )
                .limit(50)
                .get();
        if (
            snapshot.empty
        ) {
            throw new Error(
                `Không tìm thấy campus "${normalizedCampus}" trong collection "${CAMPUS_COLLECTION}".`
            );
        }
        let activeDoc =
            null;
        let fallbackDoc =
            null;
        snapshot.forEach(
            docSnap => {
                const data =
                    docSnap.data() || {};
                const code =
                    normalizeDepartmentCode(
                        data.code
                    );
                if (
                    code !== normalizedCode
                ) {
                    return;
                }
                const status =
                    String(
                        data.status || ""
                    )
                    .trim()
                    .toLowerCase();
                if (
                    status === "active"
                ) {
                    activeDoc =
                        docSnap;
                }
                if (
                    !fallbackDoc
                ) {
                    fallbackDoc =
                        docSnap;
                }
            }
        );
        const selectedDoc =
            activeDoc ||
            fallbackDoc;
        if (
            !selectedDoc
        ) {
            throw new Error(
                `Không tìm thấy phòng ban code "${normalizedCode}" tại campus "${normalizedCampus}".`
            );
        }
        const data =
            selectedDoc.data() || {};
        const result = {
            documentId:
                selectedDoc.id,
            departmentId:
                selectedDoc.id,
            departmentCode:
                normalizeDepartmentCode(
                    data.code ||
                    normalizedCode
                ),
            departmentName:
                data.name ||
                "",
            campus:
                normalizeCampus(
                    data.campus ||
                    normalizedCampus
                ),
            campusId:
                data.campusId ||
                selectedDoc.id ||
                "",
            managerUid:
                data.managerUid ||
                "",
            managerName:
                data.managerName ||
                "",
            managerEmail:
                data.managerEmail ||
                "",
            description:
                data.description ||
                "",
            status:
                data.status ||
                ""
        };
        console.log(
            "✅ ĐÃ TÌM THẤY CAMPUS DOCUMENT:",
            result
        );
        return result;
    }
    /* =====================================================
       TÌM ASSIGNEE
    ===================================================== */
    async function findTicketAssignee(ticket) {
        const campus =
            getTicketCampus(
                ticket
            );
        if (
            !campus
        ) {
            throw new Error(
                "Ticket chưa có campus."
            );
        }
        const departmentCode =
            resolveDepartmentCode(
                ticket
            );
        console.log(
            "📌 ROUTING TICKET:",
            {
                ticket:
                    getTicketNum(ticket),
                campus:
                    campus,
                departmentCode:
                    departmentCode,
                ticketType:
                    ticket.ticketType
            }
        );
        const department =
            await findCampusDepartment(
                campus,
                departmentCode
            );
        /*
         * QUAN TRỌNG:
         *
         * Không còn bắt buộc phải có managerUid.
         *
         * Ticket giờ được gán theo PHÒNG BAN
         * (departmentId/departmentCode/campus),
         * không gán theo 1 UID quản lý cụ thể.
         *
         * managerUid/managerName/managerEmail
         * chỉ giữ lại để tham khảo (ví dụ hiển thị
         * người phụ trách phòng ban), không dùng
         * để lọc ticket nữa.
         */
        if (
            !department.managerUid
        ) {
            console.warn(
                `⚠️ Phòng ban "${department.departmentCode}" tại "${department.campus}" chưa có managerUid — vẫn gán ticket theo phòng ban.`
            );
        }
        return {
            departmentId:
                department.departmentId,
            departmentCode:
                department.departmentCode,
            departmentName:
                department.departmentName,
            campus:
                department.campus,
            campusId:
                department.campusId,
            assigneeUid:
                department.managerUid || "",
            assigneeName:
                department.managerName || "",
            assigneeEmail:
                department.managerEmail || ""
        };
    }
    /* =====================================================
       ASSIGN TICKET
    ===================================================== */
    async function assignTicketIfNeeded(ticket) {
        if (
            !ticket ||
            !ticket.id
        ) {
            return ticket;
        }
        /*
         * Nếu ticket đã được gán cho
         * một PHÒNG BAN rồi thì không
         * phân công lại.
         *
         * (Trước đây check theo assigneeUid,
         * giờ check theo departmentId vì
         * ticket được gán theo phòng ban,
         * không phải theo 1 UID cụ thể.)
         */
        if (
            ticket.departmentId
        ) {
            return {
                ...ticket,
                assignmentSkipped:
                    true
            };
        }
        const ticketNum =
            getTicketNum(ticket);
        console.log(
            "🔄 Đang phân công ticket:",
            ticketNum
        );
        try {
            const assignment =
                await findTicketAssignee(
                    ticket
                );
            /*
             * Chỉ bắt buộc phải xác định
             * được PHÒNG BAN (departmentId).
             *
             * Không còn bắt buộc phải có
             * assigneeUid (managerUid) vì
             * giờ nhiều CS trong cùng phòng ban
             * đều xem được ticket của phòng ban đó.
             */
            if (
                !assignment.departmentId
            ) {
                throw new Error(
                    "Không xác định được phòng ban."
                );
            }
            /*
             * =================================================
             * TRANSACTION
             *
             * Tránh trường hợp nhiều CS cùng mở dashboard
             * rồi cùng assign một ticket.
             * =================================================
             */
            const ticketRef =
                db
                    .collection(
                        TICKET_COLLECTION
                    )
                    .doc(
                        ticket.id
                    );
            await db.runTransaction(
                async transaction => {
                    const freshDoc =
                        await transaction.get(
                            ticketRef
                        );
                    if (
                        !freshDoc.exists
                    ) {
                        throw new Error(
                            "Ticket không còn tồn tại."
                        );
                    }
                    const freshData =
                        freshDoc.data() || {};
                    /*
                     * Một CS/tab khác đã assign trước.
                     */
                    if (
                        freshData.departmentId
                    ) {
                        console.log(
                            `Ticket ${ticketNum} đã được assign trước đó.`
                        );
                        return;
                    }
                    const updateData = {
                        departmentId:
                            assignment.departmentId,
                        departmentCode:
                            assignment.departmentCode,
                        departmentName:
                            assignment.departmentName,
                        campus:
                            assignment.campus,
                        campusId:
                            assignment.campusId,
                        assigneeUid:
                            assignment.assigneeUid,
                        assigneeName:
                            assignment.assigneeName,
                        assigneeEmail:
                            assignment.assigneeEmail,
                        updatedAt:
                            firebase
                                .firestore
                                .FieldValue
                                .serverTimestamp()
                    };
                    transaction.update(
                        ticketRef,
                        updateData
                    );
                }
            );
            console.log(
                "✅ ĐÃ ASSIGN TICKET:",
                {
                    ticket:
                        ticketNum,
                    assigneeUid:
                        assignment.assigneeUid,
                    assigneeName:
                        assignment.assigneeName,
                    department:
                        assignment.departmentName,
                    campus:
                        assignment.campus
                }
            );
            return {
                ...ticket,
                ...assignment
            };
        } catch (error) {
            console.error(
                `❌ Không thể assign ticket ${ticketNum}:`,
                error
            );
            return {
                ...ticket,
                assignmentError:
                    error.message ||
                    "Không thể phân công ticket"
            };
        }
    }
    /* =====================================================
       REPAIR TICKET CŨ
    ===================================================== */
    async function repairUnassignedTickets() {
        console.log(
            "🔧 Bắt đầu repair ticket chưa phân công..."
        );
        try {
            const snapshot =
                await db
                    .collection(
                        TICKET_COLLECTION
                    )
                    .where(
                        "status",
                        "in",
                        [
                            "open",
                            "pending",
                            "in_progress"
                        ]
                    )
                    .limit(100)
                    .get();
            if (
                snapshot.empty
            ) {
                console.log(
                    "Không có ticket active."
                );
                return;
            }
            const tickets =
                [];
            snapshot.forEach(
                docSnap => {
                    tickets.push({
                        id:
                            docSnap.id,
                        ...docSnap.data()
                    });
                }
            );
            const unassigned =
                tickets.filter(
                    ticket =>
                        !ticket.departmentId
                );
            console.log(
                `📋 Tổng ticket: ${tickets.length}`
            );
            console.log(
                `📋 Ticket chưa assign: ${unassigned.length}`
            );
            if (
                unassigned.length === 0
            ) {
                return;
            }
            let success =
                0;
            let failed =
                0;
            for (
                const ticket
                of unassigned
            ) {
                const result =
                    await assignTicketIfNeeded(
                        ticket
                    );
                if (
                    result &&
                    (
                        result.departmentId ||
                        result.assignmentSkipped
                    )
                ) {
                    success++;
                } else {
                    failed++;
                }
            }
            console.log(
                "=========================================="
            );
            console.log(
                "KẾT QUẢ REPAIR:",
                {
                    total:
                        unassigned.length,
                    success:
                        success,
                    failed:
                        failed
                }
            );
            console.log(
                "=========================================="
            );
        } catch (error) {
            console.error(
                "❌ Lỗi repair ticket:",
                error
            );
        }
    }
    /* =====================================================
       REALTIME LISTENER TICKET CHƯA ASSIGN
    ===================================================== */
    let unassignedUnsubscribe =
        null;
    function startUnassignedTicketListener() {
        if (
            typeof unassignedUnsubscribe ===
            "function"
        ) {
            unassignedUnsubscribe();
            unassignedUnsubscribe =
                null;
        }
        console.log(
            "👀 Bắt đầu theo dõi ticket mới chưa assign..."
        );
        unassignedUnsubscribe =
            db
                .collection(
                    TICKET_COLLECTION
                )
                .where(
                    "status",
                    "in",
                    [
                        "open",
                        "pending",
                        "in_progress"
                    ]
                )
                .onSnapshot(
                    async snapshot => {
                        for (
                            const docSnap
                            of snapshot.docs
                        ) {
                            const ticket = {
                                id:
                                    docSnap.id,
                                ...docSnap.data()
                            };
                            /*
                             * Chỉ assign ticket
                             * chưa được gán phòng ban.
                             */
                            if (
                                ticket.departmentId
                            ) {
                                continue;
                            }
                            /*
                             * Assign.
                             */
                            await assignTicketIfNeeded(
                                ticket
                            );
                        }
                    },
                    error => {
                        console.error(
                            "❌ Listener ticket chưa assign lỗi:",
                            error
                        );
                    }
                );
    }
    /* =====================================================
       HỒ SƠ CS ĐANG ĐĂNG NHẬP
    ===================================================== */
    /*
     * Đọc document trong collection "users"
     * để biết CS đang đăng nhập thuộc
     * campus nào / phòng ban nào.
     *
     * Đây chính là chỗ quyết định CS này
     * sẽ thấy ticket của phòng ban nào,
     * KHÔNG phải dựa vào managerUid trong
     * collection "campus" nữa.
     */
    async function loadCSProfile(uid) {
        try {
            const docSnap =
                await db
                    .collection(
                        USER_COLLECTION
                    )
                    .doc(
                        uid
                    )
                    .get();
            if (
                !docSnap.exists
            ) {
                console.warn(
                    "⚠️ Không tìm thấy hồ sơ user cho uid:",
                    uid
                );
                return null;
            }
            const data =
                docSnap.data() || {};
            const profile = {
                uid:
                    uid,
                department:
                    normalizeDepartmentCode(
                        data.department ||
                        data.departmentCode ||
                        DEFAULT_DEPARTMENT_CODE
                    ),
                campus:
                    normalizeCampus(
                        data.campus ||
                        data.campusName ||
                        ""
                    ),
                name:
                    data.name ||
                    "",
                email:
                    data.email ||
                    ""
            };
            console.log(
                "🧾 Hồ sơ CS:",
                profile
            );
            return profile;
        } catch (error) {
            console.error(
                "❌ Không thể tải hồ sơ CS:",
                error
            );
            return null;
        }
    }
    /* =====================================================
       AUTH
    ===================================================== */
    let currentCSUser =
        null;
    let currentCSProfile =
        null;
    let dashboardUnsubscribe =
        null;
    auth.onAuthStateChanged(
        async user => {
            /*
             * Không đăng nhập.
             */
            if (
                !user
            ) {
                console.warn(
                    "⚠️ Không có CS đăng nhập."
                );
                if (
                    dashboardUnsubscribe
                ) {
                    dashboardUnsubscribe();
                    dashboardUnsubscribe =
                        null;
                }
                if (
                    unassignedUnsubscribe
                ) {
                    unassignedUnsubscribe();
                    unassignedUnsubscribe =
                        null;
                }
                window.location.href =
                    "/CS/login/login.html";
                return;
            }
            currentCSUser =
                user;
            console.log(
                "👤 CS đang đăng nhập:",
                {
                    uid:
                        user.uid,
                    email:
                        user.email,
                    displayName:
                        user.displayName
                }
            );
            /*
             * Bước 1:
             *
             * Lấy hồ sơ CS (campus + phòng ban)
             * để biết CS này thuộc phòng ban nào.
             */
            currentCSProfile =
                await loadCSProfile(
                    user.uid
                );
            /*
             * Bước 2:
             *
             * Repair ticket cũ.
             */
            await repairUnassignedTickets();
            /*
             * Bước 3:
             *
             * Theo dõi ticket mới.
             */
            startUnassignedTicketListener();
            /*
             * Bước 4:
             *
             * Lấy TẤT CẢ ticket thuộc
             * campus + phòng ban của CS hiện tại
             * (không chỉ ticket assign riêng cho uid này).
             */
            loadTicketsForCurrentCS(
                currentCSProfile
            );
        }
    );
    /* =====================================================
       LOAD TICKET THEO PHÒNG BAN (KHÔNG PHẢI THEO UID)
    ===================================================== */
    /*
     * QUAN TRỌNG:
     *
     * Trước đây hàm này lọc ticket theo
     * assigneeUid == uid của CS đang đăng nhập.
     * Điều đó khiến ticket chỉ hiện ra cho
     * đúng 1 người (người có managerUid trong
     * collection "campus"), còn các CS khác
     * cùng phòng ban thì KHÔNG thấy gì.
     *
     * Giờ đổi sang lọc theo departmentCode + campus
     * của chính CS đang đăng nhập (lấy từ collection
     * "users"), để CS nào cũng thấy được ticket
     * của phòng ban mình phụ trách.
     */
    function loadTicketsForCurrentCS(profile) {
        if (
            dashboardUnsubscribe
        ) {
            dashboardUnsubscribe();
            dashboardUnsubscribe =
                null;
        }
        if (
            !profile ||
            !profile.department ||
            !profile.campus
        ) {
            console.warn(
                "⚠️ CS chưa có department/campus hợp lệ trong hồ sơ (collection users) — không thể tải ticket theo phòng ban.",
                profile
            );
            showTicketLoadError();
            return;
        }
        console.log(
            "📥 Load ticket theo phòng ban:",
            {
                department:
                    profile.department,
                campus:
                    profile.campus
            }
        );
        dashboardUnsubscribe =
            db
                .collection(
                    TICKET_COLLECTION
                )
                .where(
                    "departmentCode",
                    "==",
                    profile.department
                )
                .where(
                    "campus",
                    "==",
                    profile.campus
                )
                .onSnapshot(
                    snapshot => {
                        const tickets =
                            [];
                        snapshot.forEach(
                            docSnap => {
                                tickets.push({
                                    id:
                                        docSnap.id,
                                    ...docSnap.data()
                                });
                            }
                        );
                        /*
                         * Ticket mới nhất trước.
                         */
                        tickets.sort(
                            (
                                a,
                                b
                            ) => {
                                const timeA =
                                    getTimestampMillis(
                                        a.createdAt
                                    );
                                const timeB =
                                    getTimestampMillis(
                                        b.createdAt
                                    );
                                return (
                                    timeB -
                                    timeA
                                );
                            }
                        );
                        console.log(
                            "Ticket của CS:",
                            tickets
                        );
                        renderDashboard(
                            tickets
                        );
                    },
                    error => {
                        console.error(
                            "Không thể lấy ticket của CS:",
                            error
                        );
                        showTicketLoadError();
                    }
                );
    }
    /* =====================================================
       LOAD ERROR
    ===================================================== */
    function showTicketLoadError() {
        const recentList =
            document.getElementById(
                "recentList"
            );
        if (
            recentList
        ) {
            recentList.innerHTML = `
                <div class="empty-note">
                    Không thể tải danh sách ticket.
                </div>
            `;
        }
    }
    /* =====================================================
       RENDER DASHBOARD
    ===================================================== */
    function renderDashboard(tickets) {
        renderStats(
            tickets
        );
        renderUnanswered(
            tickets
        );
        renderTypeBreakdown(
            tickets
        );
        renderRecent(
            tickets
        );
    }
    /* =====================================================
       STATISTICS
    ===================================================== */
    function renderStats(tickets) {
        const counts = {
            open:
                0,
            pending:
                0,
            in_progress:
                0,
            resolved:
                0,
            closed:
                0
        };
        tickets.forEach(
            ticket => {
                const status =
                    normalizeStatus(
                        ticket.status
                    );
                if (
                    counts[status] !==
                    undefined
                ) {
                    counts[status]++;
                }
            }
        );
        const statAll =
            document.getElementById(
                "statAll"
            );
        const statOpen =
            document.getElementById(
                "statOpen"
            );
        const statProgress =
            document.getElementById(
                "statProgress"
            );
        const statResolved =
            document.getElementById(
                "statResolved"
            );
        const statClosed =
            document.getElementById(
                "statClosed"
            );
        if (
            statAll
        ) {
            statAll.textContent =
                tickets.length;
        }
        if (
            statOpen
        ) {
            statOpen.textContent =
                counts.open +
                counts.pending;
        }
        if (
            statProgress
        ) {
            statProgress.textContent =
                counts.in_progress;
        }
        if (
            statResolved
        ) {
            statResolved.textContent =
                counts.resolved;
        }
        if (
            statClosed
        ) {
            statClosed.textContent =
                counts.closed;
        }
    }
    /* =====================================================
       UNANSWERED
    ===================================================== */
    function renderUnanswered(tickets) {
        const list =
            tickets.filter(
                ticket => {
                    const status =
                        normalizeStatus(
                            ticket.status
                        );
                    return (
                        status === "open" ||
                        status === "pending" ||
                        status === "in_progress"
                    );
                }
            );
        const countElement =
            document.getElementById(
                "unansweredCount"
            );
        if (
            countElement
        ) {
            countElement.textContent =
                list.length;
        }
        const element =
            document.getElementById(
                "unansweredList"
            );
        if (
            !element
        ) {
            return;
        }
        if (
            list.length === 0
        ) {
            element.innerHTML = `
                <div class="empty-note">
                    Tuyệt vời! Không có ticket nào đang chờ xử lý. 🎉
                </div>
            `;
            return;
        }
        element.innerHTML =
            list
                .slice(
                    0,
                    10
                )
                .map(
                    ticket => {
                        const ticketNum =
                            getTicketNum(
                                ticket
                            );
                        return `
                            <a
                                class="mini-item"
                                href="/CS/TicketManagement/cs-ticket.html?ticket=${encodeURIComponent(ticketNum)}"
                            >
                                <div class="mi-top">
                                    <span class="mi-num">
                                        ${escapeHtml(
                                            ticketNum
                                        )}
                                    </span>
                                    <span class="mi-date">
                                        ${escapeHtml(
                                            formatTicketDate(
                                                ticket
                                            )
                                        )}
                                    </span>
                                </div>
                                <div class="mi-title">
                                    ${escapeHtml(
                                        getTicketTitle(
                                            ticket
                                        )
                                    )}
                                </div>
                                <div class="mi-name">
                                    ${escapeHtml(
                                        getStudentName(
                                            ticket
                                        )
                                    )}
                                    ·
                                    <strong
                                        style="
                                            color:var(--maroon)
                                        "
                                    >
                                        ${escapeHtml(
                                            getTicketType(
                                                ticket
                                            )
                                        )}
                                    </strong>
                                </div>
                            </a>
                        `;
                    }
                )
                .join("");
    }
    /* =====================================================
       TYPE BREAKDOWN
    ===================================================== */
    function renderTypeBreakdown(tickets) {
        const counts =
            {};
        tickets.forEach(
            ticket => {
                const key =
                    getTicketType(
                        ticket
                    );
                counts[key] =
                    (
                        counts[key] ||
                        0
                    ) + 1;
            }
        );
        const entries =
            Object.entries(
                counts
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b[1] -
                    a[1]
            );
        const max =
            entries.length
                ? entries[0][1]
                : 1;
        const element =
            document.getElementById(
                "typeBarList"
            );
        if (
            !element
        ) {
            return;
        }
        if (
            entries.length === 0
        ) {
            element.innerHTML = `
                <div class="empty-note">
                    Chưa có dữ liệu phân loại.
                </div>
            `;
            return;
        }
        element.innerHTML =
            entries
                .map(
                    (
                        [
                            label,
                            count
                        ]
                    ) => {
                        const percent =
                            Math.round(
                                (
                                    count /
                                    max
                                ) *
                                100
                            );
                        return `
                            <div class="bar-row">
                                <div class="br-top">
                                    <span class="br-label">
                                        ${escapeHtml(
                                            label
                                        )}
                                    </span>
                                    <span class="br-count">
                                        ${count} phiếu
                                    </span>
                                </div>
                                <div class="bar-track">
                                    <div
                                        class="bar-fill"
                                        style="
                                            width:${percent}%
                                        "
                                    ></div>
                                </div>
                            </div>
                        `;
                    }
                )
                .join("");
    }
    /* =====================================================
       RECENT TICKETS
    ===================================================== */
    function renderRecent(tickets) {
        const countElement =
            document.getElementById(
                "recentCount"
            );
        if (
            countElement
        ) {
            countElement.textContent =
                tickets.length;
        }
        const element =
            document.getElementById(
                "recentList"
            );
        if (
            !element
        ) {
            return;
        }
        const recent =
            tickets.slice(
                0,
                10
            );
        const head = `
            <div class="recent-row head">
                <span>
                    Mã ticket
                </span>
                <span>
                    Tiêu đề &amp; Học viên
                </span>
                <span>
                    Loại yêu cầu
                </span>
                <span>
                    Ngày gửi
                </span>
                <span>
                    Trạng thái
                </span>
            </div>
        `;
        if (
            recent.length === 0
        ) {
            element.innerHTML =
                head +
                `
                    <div class="empty-note">
                        Chưa có phiếu yêu cầu nào được phân công cho bạn.
                    </div>
                `;
            return;
        }
        element.innerHTML =
            head +
            recent
                .map(
                    ticket => {
                        const ticketNum =
                            getTicketNum(
                                ticket
                            );
                        const ticketType =
                            getTicketType(
                                ticket
                            );
                        return `
                            <a
                                class="recent-row"
                                href="/CS/TicketManagement/cs-ticket.html?ticket=${encodeURIComponent(ticketNum)}"
                            >
                                <span class="rc-num">
                                    ${escapeHtml(
                                        ticketNum
                                    )}
                                </span>
                                <span class="rc-title">
                                    ${escapeHtml(
                                        getTicketTitle(
                                            ticket
                                        )
                                    )}
                                    <span class="rc-sub">
                                        ${escapeHtml(
                                            getStudentName(
                                                ticket
                                            )
                                        )}
                                    </span>
                                </span>
                                <span class="rc-type">
                                    ${svgIcon(
                                        ticket.icon
                                    )}
                                    ${escapeHtml(
                                        ticketType
                                    )}
                                </span>
                                <span class="rc-date">
                                    ${escapeHtml(
                                        formatTicketDate(
                                            ticket
                                        )
                                    )}
                                </span>
                                ${statusPill(
                                    ticket.status
                                )}
                            </a>
                        `;
                    }
                )
                .join("");
    }
    /* =====================================================
       STAT CARD CLICK
    ===================================================== */
    document
        .querySelectorAll(
            ".stat-card"
        )
        .forEach(
            card => {
                card.addEventListener(
                    "click",
                    () => {
                        const filter =
                            card.dataset.filter ||
                            "all";
                        const status =
                            card.dataset.status;
                        let url =
                            `/CS/TicketManagement/cs-ticket.html?filter=${encodeURIComponent(filter)}`;
                        if (
                            status
                        ) {
                            url +=
                                `&status=${encodeURIComponent(status)}`;
                        }
                        window.location.href =
                            url;
                    }
                );
            }
        );
    /* =====================================================
       QUICK FIND
    ===================================================== */
    const quickFindInput =
        document.getElementById(
            "quickFindInput"
        );
    const quickFindBtn =
        document.getElementById(
            "quickFindBtn"
        );
    const quickFindErr =
        document.getElementById(
            "quickFindErr"
        );
    function goToTicket() {
        if (
            !quickFindInput
        ) {
            return;
        }
        const value =
            quickFindInput.value.trim();
        if (
            !value
        ) {
            if (
                quickFindErr
            ) {
                quickFindErr.textContent =
                    "Vui lòng nhập mã ticket cần tìm.";
                quickFindErr.classList.add(
                    "show"
                );
            }
            return;
        }
        if (
            quickFindErr
        ) {
            quickFindErr.classList.remove(
                "show"
            );
        }
        window.location.href =
            `/CS/TicketManagement/cs-ticket.html?ticket=${encodeURIComponent(value)}`;
    }
    if (
        quickFindBtn
    ) {
        quickFindBtn.addEventListener(
            "click",
            goToTicket
        );
    }
    if (
        quickFindInput
    ) {
        quickFindInput.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Enter"
                ) {
                    event.preventDefault();
                    goToTicket();
                }
            }
        );
    }
    /* =====================================================
       GLOBAL DEBUG
    ===================================================== */
    window.CSDashboard =
        {
            findCampusDepartment,
            findTicketAssignee,
            assignTicketIfNeeded,
            repairUnassignedTickets,
            loadTicketsForCurrentCS,
            loadCSProfile,
            getTicketCampus,
            resolveDepartmentCode,
            normalizeCampus,
            currentUser:
                () =>
                    currentCSUser,
            currentProfile:
                () =>
                    currentCSProfile
        };
})();
