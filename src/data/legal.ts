export const COMPANY_INFORMATION = {
  legalName: "CÔNG TY TNHH CÀ PHÊ DELIVN",
  englishName: "DELIVN COFFEE COMPANY LIMITED",
  abbreviatedName: "DELIVN COFFEE CO.,LTD",
  enterpriseNumber: "3703119501",
  firstRegistration: "07/04/2023",
  latestAmendment: "18/12/2025",
  registeredOffice:
    "Ô 32, Lô H37, Đường NH15, Khu dân cư Ấp 6, Khu phố 1, Phường Thới Hòa, Thành phố Hồ Chí Minh, Việt Nam",
  phone: "0961122226",
  legalRepresentative: "ĐẶNG VĂN NAM",
  representativeTitle: "Giám đốc",
  registrationAuthority:
    "Phòng Đăng ký kinh doanh, Sở Tài chính Thành phố Hồ Chí Minh",
} as const;

export const LEGAL_ROUTE_LINKS = [
  { label: "LIÊN HỆ", href: "/lien-he" },
  { label: "THÔNG TIN DOANH NGHIỆP", href: "/thong-tin-doanh-nghiep" },
  { label: "ĐIỀU KHOẢN GIAO DỊCH", href: "/dieu-khoan-giao-dich" },
  { label: "CHÍNH SÁCH BẢO MẬT", href: "/chinh-sach-bao-mat" },
  { label: "CHÍNH SÁCH THANH TOÁN", href: "/chinh-sach-thanh-toan" },
  { label: "CHÍNH SÁCH VẬN CHUYỂN", href: "/chinh-sach-van-chuyen" },
  {
    label: "ĐỔI TRẢ & HOÀN TIỀN",
    href: "/chinh-sach-doi-tra-hoan-tien",
  },
] as const;

export type LegalRoute = (typeof LEGAL_ROUTE_LINKS)[number]["href"];

export type LegalSection = {
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
};

export type LegalPageDefinition = {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  pendingNotice?: string;
  sections: readonly LegalSection[];
};

const pendingNotice =
  "THÔNG TIN ĐANG CHỜ DOANH NGHIỆP XÁC NHẬN — Nội dung vận hành dưới đây chưa phải chính sách hoàn chỉnh để áp dụng hoặc công bố khi kinh doanh.";

export const LEGAL_PAGES: Record<LegalRoute, LegalPageDefinition> = {
  "/lien-he": {
    eyebrow: "LIÊN HỆ DELIVN",
    title: "KẾT NỐI VỚI DELIVN.",
    description:
      "Thông tin liên hệ công khai của CÔNG TY TNHH CÀ PHÊ DELIVN.",
    updated: "31/10/2026",
    sections: [
      {
        title: "THÔNG TIN LIÊN HỆ",
        items: [
          COMPANY_INFORMATION.legalName,
          `Điện thoại: ${COMPANY_INFORMATION.phone}`,
          `Trụ sở đăng ký: ${COMPANY_INFORMATION.registeredOffice}`,
        ],
      },
      {
        title: "HỖ TRỢ ĐƠN HÀNG",
        paragraphs: [
          "Khi cần trao đổi về một đơn hàng, vui lòng chuẩn bị mã đơn hàng và liên hệ theo số điện thoại công khai ở trên.",
        ],
      },
    ],
  },
  "/thong-tin-doanh-nghiep": {
    eyebrow: "THÔNG TIN DOANH NGHIỆP",
    title: "DELIVN COFFEE.",
    description:
      "Thông tin đăng ký công khai của đơn vị sở hữu và vận hành website DELIVN.",
    updated: "31/10/2026",
    sections: [
      {
        title: "NHẬN DIỆN PHÁP LÝ",
        items: [
          `Tên tiếng Việt: ${COMPANY_INFORMATION.legalName}`,
          `Tên tiếng Anh: ${COMPANY_INFORMATION.englishName}`,
          `Tên viết tắt: ${COMPANY_INFORMATION.abbreviatedName}`,
          `Mã số doanh nghiệp: ${COMPANY_INFORMATION.enterpriseNumber}`,
        ],
      },
      {
        title: "ĐĂNG KÝ DOANH NGHIỆP",
        items: [
          `Đăng ký lần đầu: ${COMPANY_INFORMATION.firstRegistration}`,
          `Thay đổi gần nhất trên giấy chứng nhận được cung cấp: ${COMPANY_INFORMATION.latestAmendment}`,
          `Cơ quan đăng ký: ${COMPANY_INFORMATION.registrationAuthority}`,
          `Trụ sở đăng ký: ${COMPANY_INFORMATION.registeredOffice}`,
        ],
      },
      {
        title: "ĐẠI DIỆN THEO PHÁP LUẬT",
        paragraphs: [
          `${COMPANY_INFORMATION.legalRepresentative} — ${COMPANY_INFORMATION.representativeTitle}.`,
        ],
      },
    ],
  },
  "/dieu-khoan-giao-dich": {
    eyebrow: "ĐIỀU KHOẢN GIAO DỊCH",
    title: "GIAO DỊCH MINH BẠCH.",
    description:
      "Thông tin về luồng đặt hàng hiện có trên website DELIVN và các nội dung đang chờ doanh nghiệp xác nhận.",
    updated: "31/10/2026",
    pendingNotice,
    sections: [
      {
        title: "QUY TRÌNH ĐẶT HÀNG HIỆN CÓ",
        items: [
          "Khách hàng chọn sản phẩm, biến thể và số lượng vào giỏ hàng.",
          "Tại bước thanh toán, khách hàng cung cấp thông tin nhận hàng và chọn một phương thức thanh toán được hệ thống hỗ trợ.",
          "Khi gửi yêu cầu, máy chủ kiểm tra lại sản phẩm, giá, trạng thái và khả năng đáp ứng trước khi tạo đơn hàng.",
          "Đơn hàng chỉ được xác nhận trên giao diện khi máy chủ trả về mã đơn và tổng tiền xác nhận.",
        ],
      },
      {
        title: "GIÁ VÀ KHẢ NĂNG ĐÁP ỨNG",
        paragraphs: [
          "Giá trong giỏ hàng là dữ liệu hiển thị tham khảo. Giá và tình trạng sản phẩm do máy chủ xác nhận tại thời điểm đặt hàng.",
          "Cách thể hiện thuế, phí vận chuyển, phí đóng gói và chi phí khác đang chờ doanh nghiệp xác nhận trước khi triển khai thương mại.",
        ],
      },
      {
        title: "NỘI DUNG CHƯA HOÀN TẤT",
        paragraphs: [
          "Phương thức và thời gian giao hàng, quy trình hủy đơn, hóa đơn, đổi trả, hoàn tiền và cơ chế tra cứu đơn sau mua chưa được doanh nghiệp phê duyệt. Website chưa sẵn sàng triển khai thương mại cho đến khi các nội dung này được hoàn tất.",
        ],
      },
    ],
  },
  "/chinh-sach-bao-mat": {
    eyebrow: "CHÍNH SÁCH BẢO MẬT",
    title: "TÔN TRỌNG DỮ LIỆU KHÁCH HÀNG.",
    description:
      "Mô tả phạm vi dữ liệu mà luồng đặt hàng hiện tại thu thập và những nội dung quản trị dữ liệu còn phải được phê duyệt.",
    updated: "31/10/2026",
    pendingNotice,
    sections: [
      {
        title: "DỮ LIỆU TRONG LUỒNG ĐẶT HÀNG",
        items: [
          "Họ và tên, số điện thoại và địa chỉ nhận hàng.",
          "Email và ghi chú đơn hàng khi khách hàng tự nguyện cung cấp.",
          "Sản phẩm, biến thể, số lượng và phương thức thanh toán khách hàng lựa chọn.",
        ],
      },
      {
        title: "MỤC ĐÍCH HIỆN CÓ",
        paragraphs: [
          "Dữ liệu được sử dụng để kiểm tra yêu cầu đặt hàng, tạo đơn hàng và hiển thị kết quả giao dịch. Thông tin biểu mẫu không được lưu vào localStorage hoặc URL bởi giao diện thanh toán.",
        ],
      },
      {
        title: "NỘI DUNG CẦN DOANH NGHIỆP PHÊ DUYỆT",
        paragraphs: [
          "Thời hạn lưu trữ, bên xử lý hoặc bên nhận dữ liệu, quy trình bảo mật vận hành, đầu mối thực hiện quyền của chủ thể dữ liệu và quy trình xử lý yêu cầu chưa được doanh nghiệp xác nhận.",
        ],
      },
    ],
  },
  "/chinh-sach-thanh-toan": {
    eyebrow: "CHÍNH SÁCH THANH TOÁN",
    title: "LỰA CHỌN THANH TOÁN.",
    description:
      "Các lựa chọn đang được hệ thống ghi nhận, không phải hướng dẫn chuyển tiền hoàn chỉnh.",
    updated: "31/10/2026",
    pendingNotice,
    sections: [
      {
        title: "PHƯƠNG THỨC HỆ THỐNG HỖ TRỢ",
        items: ["Thanh toán khi nhận hàng (COD).", "Chuyển khoản ngân hàng."],
      },
      {
        title: "TRẠNG THÁI THANH TOÁN",
        paragraphs: [
          "Việc chọn chuyển khoản không đồng nghĩa khoản tiền đã được thanh toán. Sau khi tạo đơn, giao diện chỉ hiển thị trạng thái thanh toán do máy chủ trả về.",
        ],
      },
      {
        title: "HƯỚNG DẪN CÒN THIẾU",
        paragraphs: [
          "Doanh nghiệp chưa cung cấp tài khoản thụ hưởng, nội dung chuyển khoản hoặc quy trình đối soát. Không thực hiện chuyển tiền dựa trên thông tin không xuất hiện trong chính sách đã được doanh nghiệp phê duyệt.",
        ],
      },
    ],
  },
  "/chinh-sach-van-chuyen": {
    eyebrow: "CHÍNH SÁCH VẬN CHUYỂN",
    title: "THÔNG TIN GIAO NHẬN.",
    description:
      "Phương thức, phạm vi, thời gian và chi phí giao hàng chưa được doanh nghiệp phê duyệt.",
    updated: "31/10/2026",
    pendingNotice,
    sections: [
      {
        title: "NỘI DUNG CẦN XÁC NHẬN",
        items: [
          "Đơn vị và phương thức giao hàng.",
          "Khu vực phục vụ và giới hạn địa lý.",
          "Thời gian xử lý, thời gian giao dự kiến và cách xử lý chậm trễ.",
          "Phí vận chuyển và cách hiển thị phí trước khi khách hàng đặt hàng.",
        ],
      },
      {
        title: "TRẠNG THÁI HIỆN TẠI",
        paragraphs: [
          "Website chưa công bố cam kết giao hàng. Giá trị vận chuyển trong môi trường phát triển không phải chính sách thương mại và không được dùng làm cam kết với khách hàng.",
        ],
      },
    ],
  },
  "/chinh-sach-doi-tra-hoan-tien": {
    eyebrow: "ĐỔI TRẢ & HOÀN TIỀN",
    title: "QUY TRÌNH CẦN ĐƯỢC XÁC NHẬN.",
    description:
      "Điều kiện đổi trả và hoàn tiền chưa được doanh nghiệp phê duyệt để áp dụng thương mại.",
    updated: "31/10/2026",
    pendingNotice,
    sections: [
      {
        title: "NỘI DUNG CẦN XÁC NHẬN",
        items: [
          "Trường hợp được đổi hoặc trả hàng và thời hạn yêu cầu.",
          "Tình trạng sản phẩm, chứng từ và bằng chứng cần cung cấp.",
          "Cách gửi trả hàng và bên chịu chi phí phát sinh.",
          "Phương thức, thời hạn hoàn tiền và quy trình giải quyết khiếu nại.",
          "Phạm vi bảo hành, nếu doanh nghiệp áp dụng.",
        ],
      },
      {
        title: "LIÊN HỆ",
        paragraphs: [
          `Trong thời gian chính sách chưa được phê duyệt, vui lòng không coi trang này là cam kết đổi trả. Có thể liên hệ ${COMPANY_INFORMATION.phone} để yêu cầu thông tin từ doanh nghiệp.`,
        ],
      },
    ],
  },
};
