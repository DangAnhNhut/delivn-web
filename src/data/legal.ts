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
  email: "Vietnamdelicoffee@gmail.com",
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

export const LEGAL_PAGES: Record<LegalRoute, LegalPageDefinition> = {
  "/lien-he": {
    eyebrow: "LIÊN HỆ DELIVN",
    title: "KẾT NỐI VỚI DELIVN.",
    description:
      "Thông tin liên hệ công khai của CÔNG TY TNHH CÀ PHÊ DELIVN.",
    updated: "13/11/2026",
    sections: [
      {
        title: "THÔNG TIN LIÊN HỆ",
        items: [
          COMPANY_INFORMATION.legalName,
          `Điện thoại: ${COMPANY_INFORMATION.phone}`,
          `Email: ${COMPANY_INFORMATION.email}`,
          `Trụ sở đăng ký: ${COMPANY_INFORMATION.registeredOffice}`,
        ],
      },
      {
        title: "HỖ TRỢ ĐƠN HÀNG",
        paragraphs: [
          `Khi cần trao đổi về đơn hàng hoặc các vấn đề liên quan, quý khách vui lòng chuẩn bị mã đơn hàng và liên hệ theo hotline ${COMPANY_INFORMATION.phone} hoặc email ${COMPANY_INFORMATION.email}.`,
        ],
      },
    ],
  },
  "/thong-tin-doanh-nghiep": {
    eyebrow: "THÔNG TIN DOANH NGHIỆP",
    title: "DELIVN COFFEE.",
    description:
      "Thông tin đăng ký công khai của đơn vị sở hữu và vận hành website DELIVN.",
    updated: "13/11/2026",
    sections: [
      {
        title: "NHẬN DIỆN PHÁP LÝ",
        items: [
          `Tên tiếng Việt: ${COMPANY_INFORMATION.legalName}`,
          `Tên tiếng Anh: ${COMPANY_INFORMATION.englishName}`,
          `Tên viết tắt: ${COMPANY_INFORMATION.abbreviatedName}`,
          `Mã số doanh nghiệp: ${COMPANY_INFORMATION.enterpriseNumber}`,
          `Email liên hệ: ${COMPANY_INFORMATION.email}`,
          `Hotline: ${COMPANY_INFORMATION.phone}`,
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
      "Quy chế và điều khoản giao dịch thương mại điện tử áp dụng cho khách hàng mua sắm tại DELIVN.",
    updated: "13/11/2026",
    sections: [
      {
        title: "QUY TRÌNH ĐẶT HÀNG",
        items: [
          "Khách hàng lựa chọn sản phẩm, quy cách đóng gói và số lượng phù hợp vào giỏ hàng.",
          "Tại trang thanh toán, khách hàng cung cấp chính xác thông tin người nhận (họ tên, số điện thoại, địa chỉ nhận hàng) và lựa chọn phương thức thanh toán được hỗ trợ.",
          "Máy chủ kiểm tra tính hợp lệ của sản phẩm, tồn kho khả dụng và tính toán đơn hàng trước khi tạo mã đơn.",
          "Đơn hàng được ghi nhận và hiển thị thông tin xác nhận sau khi quá trình gửi thông tin thành công.",
        ],
      },
      {
        title: "GIÁ BÁN VÀ THUẾ GIÁ TRỊ GIA TĂNG (VAT)",
        paragraphs: [
          "Giá sản phẩm niêm yết trên website là giá bán cuối cùng đã bao gồm thuế giá trị gia tăng (VAT) theo quy định của pháp luật Việt Nam.",
          "DELIVN hỗ trợ xuất hóa đơn điện tử cho các đơn hàng theo yêu cầu của khách hàng khi cung cấp đầy đủ thông tin xuất hóa đơn.",
        ],
      },
      {
        title: "GIAO NHẬN VÀ PHÍ VẬN CHUYỂN",
        paragraphs: [
          "DELIVN giao hàng toàn quốc trên 34 tỉnh, thành phố trực thuộc Trung ương thông qua các đơn vị dịch vụ logistics bên thứ ba uy tín (như GHN, J&T Express hoặc đối tác vận chuyển phù hợp khác).",
          "Phí vận chuyển được tính theo biểu phí thực tế của đơn vị vận chuyển đối tác dựa trên khối lượng kiện hàng và địa chỉ nhận hàng. Website không áp dụng chính sách miễn phí vận chuyển mặc định.",
        ],
      },
      {
        title: "THANH TOÁN, ĐỔI TRẢ VÀ HOÀN TIỀN",
        paragraphs: [
          "Khách hàng có thể thanh toán khi nhận hàng (COD). Phương thức chuyển khoản ngân hàng đang được chuẩn bị hạ tầng kỹ thuật và tài khoản doanh nghiệp chính thức.",
          "Khách hàng được quyền gửi yêu cầu đổi trả trong vòng 07 ngày kể từ khi nhận hàng. DELIVN chịu chi phí vận chuyển đổi trả nếu lỗi thuộc về DELIVN; khách hàng chịu chi phí vận chuyển nếu xuất phát từ nhu cầu thay đổi của khách hàng. Khoản tiền hoàn lại được chi trả qua chuyển khoản ngân hàng trong vòng 48 giờ làm việc sau khi yêu cầu được chấp thuận.",
        ],
      },
    ],
  },
  "/chinh-sach-bao-mat": {
    eyebrow: "CHÍNH SÁCH BẢO MẬT",
    title: "BẢO VỆ DỮ LIỆU CÁ NHÂN.",
    description:
      "Chính sách bảo vệ dữ liệu cá nhân theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định số 356/2025/NĐ-CP.",
    updated: "28/11/2026",
    sections: [
      {
        title: "DỮ LIỆU THU THẬP KHI ĐẶT HÀNG",
        items: [
          "Họ và tên, số điện thoại liên lạc và địa chỉ nhận hàng (bắt buộc để thực hiện giao nhận đơn hàng).",
          "Địa chỉ email và ghi chú đơn hàng khi khách hàng tự nguyện cung cấp (tùy chọn).",
          "Chi tiết đơn hàng gồm sản phẩm, quy cách, số lượng và phương thức thanh toán lựa chọn.",
        ],
      },
      {
        title: "TÀI KHOẢN VÀ BIỆN PHÁP AN TOÀN KỸ THUẬT",
        items: [
          "Tài khoản sử dụng họ tên, email và mật khẩu xác thực để quản lý và theo dõi lịch sử đơn hàng; nếu chọn đăng nhập qua Google, hệ thống tiếp nhận tên, email đã xác minh và ảnh đại diện từ Google OAuth.",
          "Phiên đăng nhập được quản lý trong cơ sở dữ liệu với cookie xác thực HttpOnly.",
          "Hệ thống ghi nhận và lưu trữ có thời hạn địa chỉ IP cùng định danh kỹ thuật trong cơ sở dữ liệu nhằm kiểm soát tần suất truy cập (rate limiting), bảo vệ an toàn tài khoản và phòng ngừa các hành vi truy cập trái phép hoặc tấn công dịch vụ.",
        ],
      },
      {
        title: "COOKIE VÀ LƯU TRỮ TRÌNH DUYỆT (LOCALSTORAGE)",
        items: [
          "Cookie phiên đăng nhập (chỉ phục vụ xác thực, HttpOnly): duy trì trạng thái đăng nhập an toàn và tự hủy khi khách hàng đăng xuất hoặc hết thời hạn phiên.",
          "Bộ nhớ trình duyệt localStorage (khóa delivn.cart.v1): chỉ lưu danh sách sản phẩm trong giỏ hàng trên thiết bị của khách hàng (mã sản phẩm, quy cách, số lượng, ảnh hiển thị); không lưu mật khẩu hay thông tin thanh toán.",
          "Website hiện không sử dụng cookie quảng cáo hoặc công cụ theo dõi hành vi tiếp thị của bên thứ ba.",
        ],
      },
      {
        title: "MỤC ĐÍCH VÀ CƠ SỞ XỬ LÝ DỮ LIỆU",
        paragraphs: [
          "Dữ liệu cá nhân được xử lý để thực hiện nghĩa vụ hợp đồng và giao dịch với khách hàng (tạo/quản lý tài khoản, xác nhận và xử lý đơn hàng, hỗ trợ khách hàng, xuất hóa đơn điện tử khi có yêu cầu) và bảo đảm an toàn hệ thống thông tin theo quy định pháp luật hiện hành.",
        ],
      },
      {
        title: "CHIA SẺ DỮ LIỆU VỚI BÊN THỨ BA VÀ HẠ TẦNG",
        items: [
          "Hạ tầng vận hành ứng dụng và cơ sở dữ liệu: dịch vụ lưu trữ ứng dụng web (Vercel) và cơ sở dữ liệu (Neon PostgreSQL). Dữ liệu trên hạ tầng đám mây có thể được xử lý tại máy chủ đặt ngoài lãnh thổ Việt Nam; doanh nghiệp thực hiện rà soát và hoàn thiện hồ sơ theo quy định về chuyển dữ liệu xuyên biên giới tại Điều 20 Luật 91/2025/QH15 và Nghị định 356/2025/NĐ-CP.",
          "Nhà cung cấp xác thực Google OAuth: chỉ phát sinh khi khách hàng chủ động chọn tiếp tục bằng tài khoản Google.",
          "Đơn vị vận chuyển đối tác: khi tính năng vận chuyển trực tuyến được kích hoạt chính thức, thông tin người nhận cần thiết (họ tên, số điện thoại, địa chỉ giao hàng) mới được chuyển cho đơn vị giao nhận tương ứng để thực hiện giao hàng.",
        ],
      },
      {
        title: "THỜI HẠN LƯU TRỮ DỮ LIỆU",
        items: [
          "Phiên đăng nhập: tối đa 07 ngày kể từ lần cấp hoặc làm mới gần nhất (cập nhật mỗi 24 giờ khi hoạt động), hoặc chấm dứt ngay khi khách hàng đăng xuất.",
          "Dữ liệu kiểm soát tần suất truy cập (IP và định danh kỹ thuật trong bảng rate_limit): lưu tạm thời theo cửa sổ kiểm soát an toàn và thu dọn định kỳ.",
          "Dữ liệu tài khoản và lịch sử đơn hàng: lưu trữ phục vụ quản lý tài khoản, bảo hành/đổi trả và đáp ứng nghĩa vụ lưu giữ chứng từ kế toán, thương mại điện tử theo quy định pháp luật.",
        ],
      },
      {
        title: "QUYỀN VÀ QUY TRÌNH TIẾP NHẬN YÊU CẦU CỦA CHỦ THỂ DỮ LIỆU",
        items: [
          "Khách hàng có các quyền theo Điều 4 Luật 91/2025/QH15: được biết về hoạt động xử lý dữ liệu; đồng ý, không đồng ý hoặc rút lại sự đồng ý; xem, chỉnh sửa hoặc yêu cầu chỉnh sửa; yêu cầu cung cấp, xóa, hạn chế xử lý, phản đối xử lý dữ liệu và khiếu nại theo quy định pháp luật.",
          `Kênh tiếp nhận yêu cầu: gửi email tới ${COMPANY_INFORMATION.email} hoặc liên hệ hotline ${COMPANY_INFORMATION.phone}, nêu rõ nội dung yêu cầu và thông tin đơn hàng/email tài khoản để đối chiếu xác minh danh tính. Quý khách không gửi mật khẩu, mã OTP hoặc ảnh CCCD qua email thông thường.`,
          "Thời hạn giải quyết theo Điều 5 Nghị định 356/2025/NĐ-CP: đối với yêu cầu rút lại sự đồng ý, hạn chế hoặc phản đối xử lý, DELIVN phản hồi trong 02 ngày làm việc và thực hiện trong 15 ngày (20 ngày nếu liên quan bên thứ ba), trừ trường hợp pháp luật quy định xử lý không cần sự đồng ý; đối với yêu cầu xem, chỉnh sửa hoặc cung cấp dữ liệu, thực hiện trong 10 ngày (15 ngày nếu cần phối hợp bên thứ ba); đối với yêu cầu xóa dữ liệu, thực hiện trong 20 ngày (30 ngày nếu cần phối hợp bên thứ ba), ngoại trừ dữ liệu bắt buộc lưu giữ theo pháp luật kế toán và thương mại điện tử.",
        ],
      },
    ],
  },
  "/chinh-sach-thanh-toan": {
    eyebrow: "CHÍNH SÁCH THANH TOÁN",
    title: "PHƯƠNG THỨC THANH TOÁN.",
    description:
      "Thông tin chi tiết về các phương thức thanh toán được hỗ trợ khi mua hàng tại DELIVN.",
    updated: "13/11/2026",
    sections: [
      {
        title: "PHƯƠNG THỨC ĐANG HOẠT ĐỘNG",
        items: [
          "Thanh toán khi nhận hàng (COD): Quý khách thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng sau khi nhận và kiểm tra bao bì sản phẩm.",
        ],
      },
      {
        title: "PHƯƠNG THỨC ĐANG CẬP NHẬT",
        items: [
          "Chuyển khoản ngân hàng / Mã QR: Hệ thống đang trong quá trình cập nhật hạ tầng thanh toán tự động và tài khoản doanh nghiệp chính thức. Phương thức này tạm thời chưa kích hoạt tại bước thanh toán.",
        ],
      },
      {
        title: "LƯU Ý AN TOÀN THANH TOÁN",
        paragraphs: [
          "DELIVN hiện chưa công bố số tài khoản ngân hàng chính thức trên trang thanh toán trực tuyến. Quý khách vui lòng không thực hiện chuyển tiền vào bất kỳ tài khoản cá nhân nào không được xác thực chính thức từ DELIVN.",
        ],
      },
    ],
  },
  "/chinh-sach-van-chuyen": {
    eyebrow: "CHÍNH SÁCH VẬN CHUYỂN",
    title: "GIAO NHẬN HÀNG HÓA.",
    description:
      "Quy định về phạm vi giao hàng, đối tác vận chuyển, cách tính cước phí và thời gian giao hàng.",
    updated: "13/11/2026",
    sections: [
      {
        title: "PHẠM VI VÀ ĐƠN VỊ VẬN CHUYỂN",
        items: [
          "Phạm vi giao hàng: Áp dụng trên toàn quốc tại tất cả 34 tỉnh, thành phố trực thuộc Trung ương của Việt Nam.",
          "Đơn vị vận chuyển: DELIVN liên kết với các đơn vị dịch vụ logistics bên thứ ba chuyên nghiệp (như GHN, J&T Express hoặc đối tác vận chuyển phù hợp khác) để đảm bảo hàng hóa đến tay khách hàng nhanh chóng và an toàn.",
        ],
      },
      {
        title: "CƯỚC PHÍ VẬN CHUYỂN",
        paragraphs: [
          "Cước phí vận chuyển không phải là một mức cố định và website không áp dụng chính sách miễn phí vận chuyển mặc định.",
          "Phí giao hàng được tính toán dựa trên biểu phí thực tế của đơn vị vận chuyển đối tác, phụ thuộc vào khối lượng kiện hàng, kích thước đóng gói và địa bàn nhận hàng cụ thể của khách hàng.",
        ],
      },
      {
        title: "THỜI GIAN GIAO HÀNG DỰ KIẾN",
        paragraphs: [
          "Thời gian giao hàng phụ thuộc vào địa chỉ nhận hàng của khách hàng, đơn vị dịch vụ logistics được lựa chọn và điều kiện cung ứng dịch vụ thực tế của đơn vị vận chuyển.",
          "Trong trường hợp phát sinh chậm trễ do điều kiện thời tiết hoặc sự cố vận hành khách quan, DELIVN sẽ phối hợp chặt chẽ với đối tác chuyển phát để thông báo và cập nhật tiến độ kịp thời tới khách hàng.",
        ],
      },
    ],
  },
  "/chinh-sach-doi-tra-hoan-tien": {
    eyebrow: "ĐỔI TRẢ & HOÀN TIỀN",
    title: "QUY ĐỊNH ĐỔI TRẢ VÀ HOÀN TIỀN.",
    description:
      "Chính sách bảo vệ quyền lợi người tiêu dùng, quy định về đổi trả sản phẩm và thủ tục hoàn tiền tại DELIVN.",
    updated: "13/11/2026",
    sections: [
      {
        title: "THỜI HẠN YÊU CẦU ĐỔI TRẢ",
        paragraphs: [
          "Khách hàng có quyền gửi yêu cầu đổi hoặc trả sản phẩm trong vòng 07 ngày kể từ ngày nhận hàng từ đơn vị giao vận.",
        ],
      },
      {
        title: "ĐIỀU KIỆN ĐỔI TRẢ",
        items: [
          "Sản phẩm được giao không đúng chủng loại, quy cách đóng gói hoặc số lượng như trong đơn đặt hàng đã xác nhận.",
          "Sản phẩm hoặc bao bì bị biến dạng, rách hỏng do quá trình đóng gói hoặc vận chuyển.",
          "Khách hàng vui lòng lưu giữ hóa đơn hoặc phiếu giao hàng, kèm theo hình ảnh hoặc video mở kiện hàng làm bằng chứng đối soát.",
          "Lưu ý: Tiêu chuẩn chi tiết về tình trạng bao bì và niêm phong sản phẩm khi đổi trả đang được doanh nghiệp hoàn thiện quy chế ban hành nội bộ.",
        ],
      },
      {
        title: "TRÁCH NHIỆM CHI PHÍ VẬN CHUYỂN ĐỔI TRẢ",
        paragraphs: [
          "Trường hợp đổi trả do lỗi của DELIVN hoặc đơn vị vận chuyển (sai hàng, hàng hư hỏng): DELIVN chịu 100% chi phí vận chuyển đổi trả hai chiều.",
          "Trường hợp đổi trả phát sinh do nhu cầu cá nhân của khách hàng: Khách hàng chịu toàn bộ chi phí vận chuyển phát sinh theo biểu phí của đơn vị giao nhận.",
        ],
      },
      {
        title: "PHƯƠNG THỨC VÀ THỜI GIAN HOÀN TIỀN",
        paragraphs: [
          "Sau khi nhận lại sản phẩm và kiểm tra xác nhận đáp ứng điều kiện đổi trả, DELIVN sẽ tiến hành hoàn tiền cho khách hàng.",
          "Hình thức hoàn tiền: Chuyển khoản ngân hàng trực tiếp vào số tài khoản do khách hàng cung cấp.",
          "Thời hạn hoàn tiền: Trong vòng 48 giờ làm việc kể từ thời điểm yêu cầu đổi trả được DELIVN phê duyệt.",
        ],
      },
      {
        title: "ĐẦU MỐI TIẾP NHẬN YÊU CẦU",
        paragraphs: [
          `Mọi yêu cầu hỗ trợ đổi trả và hoàn tiền, quý khách vui lòng liên hệ hotline ${COMPANY_INFORMATION.phone} hoặc gửi thư điện tử đến ${COMPANY_INFORMATION.email} kèm theo mã đơn hàng để được giải quyết nhanh chóng.`,
        ],
      },
    ],
  },
};
