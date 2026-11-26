import type { ProductCategory } from "@/contracts";

export interface CoffeeLineDetailContent {
  buyerLabel: string;
  officialName: string;
  productType: string;
  catalogDescription: string;
  detailShortDescription: string;
  ingredients: string;
  roastRatio: string;
  characteristics: readonly string[];
  brewing: {
    intro: string;
    steps?: readonly string[];
  };
}

export const COFFEE_LINE_DETAILS: Record<
  ProductCategory,
  CoffeeLineDetailContent
> = {
  espresso: {
    buyerLabel: "CÀ PHÊ PHA MÁY",
    officialName: "Cà phê hạt rang Espresso Special Tây Nguyên VietNam",
    productType: "Cà phê hạt rang",
    catalogDescription:
      "Cà phê hạt rang — 100% cà phê (70% Robusta - 30% Arabica) · Lựa chọn 250g hoặc 500g.",
    detailShortDescription:
      "Cà phê hạt rang – 100% cà phê (70% Robusta - 30% Arabica).",
    ingredients: "100% cà phê (70% Robusta - 30% Arabica).",
    roastRatio: "100% cà phê (70% Robusta - 30% Arabica)",
    characteristics: [
      "Cà phê hạt phù hợp pha máy.",
      "Tạo lớp crema dày, cà phê có cảm giác sánh mịn.",
      "Hương thơm đặc trưng của cà phê.",
      "Mùi vị: chua thanh, đắng nhẹ.",
      "Hậu vị: ngọt thơm, đậm vị cà phê nguyên bản.",
    ],
    brewing: {
      intro:
        "Xay hạt cà phê trước khi pha chế. Sản phẩm có thể sử dụng với nhiều phương pháp pha khác nhau.",
    },
  },
  rang_xay: {
    buyerLabel: "CÀ PHÊ PHA PHIN",
    officialName: "Cà phê rang xay pha phin truyền thống Tây Nguyên VietNam",
    productType: "Cà phê rang xay",
    catalogDescription:
      "Cà phê rang xay pha phin — 100% cà phê (90% Robusta - 10% Arabica) · Lựa chọn 250g hoặc 500g.",
    detailShortDescription:
      "Cà phê rang xay pha phin – 100% cà phê (90% Robusta - 10% Arabica).",
    ingredients: "100% cà phê (90% Robusta - 10% Arabica).",
    roastRatio: "100% cà phê (90% Robusta - 10% Arabica)",
    characteristics: [
      "Cà phê bột phù hợp pha phin, hương vị đậm đà, tròn vị.",
      "Mùi thơm đặc trưng của cà phê.",
      "Mùi vị: chua thanh, đậm vị cà phê nguyên bản.",
      "Hậu vị: ngọt thơm.",
    ],
    brewing: {
      intro: "Hướng dẫn pha phin truyền thống:",
      steps: [
        "Cho 20g cà phê (khoảng 3 muỗng cà phê) vào phin.",
        "Rót 30mL nước nóng ở khoảng 90–96°C vào phin.",
        "Đợi khoảng 2 phút.",
        "Rót tiếp 45mL nước nóng để hoàn tất quá trình pha.",
        "Có thể thêm sữa đặc, đường hoặc đá tùy khẩu vị.",
      ],
    },
  },
};

export const SHARED_COFFEE_SPECS = {
  brand: "DELIVN",
  origin: "Việt Nam",
  shelfLife: "18 tháng",
  manufacturer: "Công ty TNHH Cà Phê DELIVN",
  address:
    "Ô 32, Lô H37, Đường NH15, Khu dân cư Ấp 6, Khu phố 1, Phường Thới Hòa, TP. Hồ Chí Minh, Việt Nam.",
  manufactureDate: "In trên bao bì sản phẩm.",
  packaging:
    "Túi nhựa in offset hai lớp, bên trong là màng nhôm, có van một chiều hỗ trợ giữ độ tươi của cà phê.",
  afterOpening:
    "Nên sử dụng trong vòng 1 tháng sau khi mở bao bì để thưởng thức hương vị tốt nhất.",
  storage: [
    "Bảo quản ở nơi khô ráo, thoáng mát.",
    "Tránh ánh nắng trực tiếp.",
    "Tránh môi trường có độ ẩm cao.",
    "Đóng kín bao bì sau khi sử dụng.",
    "Không đặt sản phẩm gần nguồn nhiệt cao.",
  ],
  safetyWarnings: [
    "Không sử dụng sản phẩm đã hết hạn.",
    "Không bảo quản gần nơi có nhiệt độ cao.",
    "Không sử dụng nếu dị ứng với thành phần của sản phẩm.",
  ],
  deliveryNote:
    "Thời gian giao hàng dự kiến từ 3–5 ngày kể từ khi đơn hàng được bàn giao cho đơn vị vận chuyển. Thời gian nhận hàng thực tế có thể thay đổi tùy theo khu vực và tình trạng vận chuyển. Phí vận chuyển được tính theo biểu phí của đơn vị vận chuyển tại bước thanh toán.",
  returnNote:
    "Sản phẩm được hỗ trợ đổi trả theo chính sách hiện hành trong vòng 07 ngày kể từ ngày nhận hàng. Khách hàng vui lòng quay video toàn bộ quá trình mở kiện hàng để shop có cơ sở kiểm tra và hỗ trợ nhanh chóng nếu sản phẩm phát sinh vấn đề.",
} as const;

