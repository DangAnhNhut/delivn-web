export const heroContent = {
  eyebrow: "CÀ PHÊ VIỆT NAM · TỪ TÂY NGUYÊN",
  headline: {
    line1: "CÀ PHÊ VIỆT,",
    line2: "ĐẬM DẤU ẤN",
    highlight: "TÂY NGUYÊN.",
  },
  description:
    "DELIVN mang đến hai dòng cà phê với tinh thần hiện đại, được khơi nguồn từ bản sắc Tây Nguyên và hoàn thiện cho trải nghiệm thưởng thức mỗi ngày.",
  cta: {
    label: "CHỌN CÀ PHÊ CỦA BẠN",
    href: "/san-pham",
  },
  scrollCue: "CUỘN ĐỂ KHÁM PHÁ",
  productImage: {
    src: "/products/hero/delivn-hero-master.png",
    alt: "DELIVN Cà Phê Tây Nguyên — Bản Cát & Bản Đen",
    width: 620,
    height: 620,
  },
} as const;

export const coffeeLinesContent = {
  eyebrow: "HAI DÒNG CÀ PHÊ",
  headline: {
    main: "HAI TRẢI NGHIỆM,",
    italic: "MỘT TINH THẦN",
    brand: "DELIVN.",
  },
  intro:
    "Mỗi dòng cà phê của DELIVN là một cách thưởng thức khác nhau, nhưng cùng bắt đầu từ cảm hứng Tây Nguyên. Từ sự mạnh mẽ, rõ nét của espresso đến hương vị đậm đà, gần gũi của cà phê rang xay pha phin, DELIVN mang đến hai lựa chọn phù hợp cho những nhịp thưởng thức khác nhau trong ngày.",
  products: [
    {
      index: "01 / DÒNG HIỆN ĐẠI",
      weight: "500G NGUYÊN BẢN",
      title: "CÀ PHÊ HẠT RANG ESPRESSO",
      descriptors: ["Mạnh mẽ", "Cân bằng", "Hiện đại"],
      description:
        "Phù hợp với người yêu espresso có hậu vị rõ, cấu trúc vị chắc và chiều sâu hương thơm ấn tượng. Đây là lựa chọn dành cho những khoảnh khắc cần sự tập trung, rõ nét và một cá tính vị mạnh mẽ hơn.",
      cta: {
        label: "XEM CÀ PHÊ ESPRESSO",
        href: "/san-pham/ca-phe-hat-rang-espresso",
      },
      image: {
        src: "/products/home/coffee-lines/delivn-espresso-line.jpg",
        alt: "DELIVN Cà Phê Hạt Rang Espresso 500g bao bì đen mờ minh họa Tây Nguyên",
        width: 512,
        height: 383,
      },
    },
    {
      index: "02 / BẢN NỀN CÁT KRAFT",
      weight: "500G NGUYÊN BẢN",
      title: "CÀ PHÊ RANG XAY",
      descriptors: ["Gần gũi", "Đậm vị", "Chuẩn gu Việt"],
      description:
        "Dành cho những ai yêu hương vị cà phê truyền thống, đậm đà, tròn vị và phù hợp với nhịp thưởng thức chậm rãi mỗi ngày. Đây là dòng cà phê gợi nhắc sự quen thuộc nhưng vẫn giữ tinh thần tinh gọn và hiện đại của DELIVN.",
      cta: {
        label: "XEM CÀ PHÊ RANG XAY",
        href: "/san-pham/ca-phe-rang-xay",
      },
      image: {
        src: "/products/home/coffee-lines/delivn-rang-xay-line.jpg",
        alt: "DELIVN Cà Phê Rang Xay 500g bao bì màu cát kraft minh họa voi Tây Nguyên",
        width: 512,
        height: 383,
      },
    },
  ],
  bottomCta: {
    label: "XEM TOÀN BỘ SẢN PHẨM",
    href: "/san-pham",
  },
} as const;

export const packagingExperienceContent = {
  eyebrow: "KHÔNG CHỈ LÀ BAO BÌ",
  headline: {
    main: "MỖI GÓC NHÌN,",
    italic: "một phần câu chuyện.",
  },
  description:
    "Bao bì DELIVN không chỉ bảo vệ cà phê bên trong. Từ mặt trước, hai cạnh bên đến mặt sau, mỗi chi tiết đều được xây dựng để kể tiếp câu chuyện về sản phẩm, vùng đất Tây Nguyên và tinh thần cà phê Việt.",
  selectorLabel: "LỰA CHỌN DÒNG SẢN PHẨM",
  products: {
    sand: {
      id: "sand",
      title: "CÀ PHÊ RANG XAY",
      subtitle: "Pha phin truyền thống",
      modelPath: "/models/delivn/delivn-sand-500.glb",
      thumbnail: "/products/sand/front.png",
      fallbackImage: "/products/sand/three-quarter.png",
      alt: "DELIVN Cà Phê Rang Xay 500g bao bì màu cát kraft",
    },
    black: {
      id: "black",
      title: "HẠT RANG ESPRESSO",
      subtitle: "Rang mộc chuyên biệt",
      modelPath: "/models/delivn/delivn-black-500.glb",
      thumbnail: "/products/black/front.png",
      fallbackImage: "/products/black/three-quarter.png",
      alt: "DELIVN Cà Phê Hạt Rang Espresso 500g bao bì đen mờ",
    },
  },
  storyStates: [
    {
      id: 1,
      index: "01",
      label: "MẶT TRƯỚC",
      title: "DẤU ẤN ĐẦU TIÊN",
      description:
        "Mặt trước định hình cá tính của từng dòng cà phê — từ sắc cát ấm áp của cà phê rang xay đến sắc đen mạnh mẽ của Espresso.",
      targetAngle: 0,
    },
    {
      id: 2,
      index: "02",
      label: "CẠNH BÊN",
      title: "CÂU CHUYỆN TIẾP NỐI",
      description:
        "Khi sản phẩm xoay, những chi tiết về nguồn gốc, câu chuyện Tây Nguyên và thông tin sản phẩm dần được hé lộ trên hai cạnh bao bì.",
      targetAngle: -0.95,
    },
    {
      id: 3,
      index: "03",
      label: "MẶT SAU",
      title: "TRỌN VẸN MỘT THIẾT KẾ",
      description:
        "Từ thông tin sản phẩm đến những nét minh họa tiếp nối, mặt sau hoàn thiện một hệ hình ảnh thống nhất quanh toàn bộ bao bì DELIVN.",
      targetAngle: -2.5,
    },
  ],
  interactionCaption: "XOAY ĐỂ KHÁM PHÁ BAO BÌ",
  scrollCue: "CUỘN ĐỂ KHÁM PHÁ TOÀN DIỆN THIẾT KẾ",
  bottomMeta: {
    brand: "DELIVN HERITAGE ROAST — HỆ THỐNG TRẢI NGHIỆM KỸ THUẬT SỐ ĐƯƠNG ĐẠI",
    cue: "TIẾP TỤC CUỘN ĐỂ KHÁM PHÁ CÂU CHUYỆN NGUỒN GỐC & CÁCH PHA →",
  },
} as const;

export const brandStoryContent = {
  eyebrow: "NGUỒN CẢM HỨNG & DI SẢN",
  headline: {
    line1: "TÂY NGUYÊN,",
    line2: "THỦ PHỦ CÀ PHÊ THƯỢNG HẠNG.",
  },
  sublead:
    "Tây Nguyên là vùng đất hùng vĩ nổi tiếng với lớp đất bazan màu mỡ và được mệnh danh là thủ phủ của cà phê thượng hạng — nơi khởi nguồn cho những câu chuyện di sản và sứ mệnh bản sắc của DeliVN.",
  steps: [
    {
      id: "01",
      number: "01",
      name: "BẢN SẮC TÂY NGUYÊN",
      label: "01 · BẢN SẮC TÂY NGUYÊN",
      tagline: "VÙNG ĐẤT BAZAN MÀU MỠ",
      title: "NƠI BẢN SẮC BẮT ĐẦU",
      description:
        "Tây Nguyên là vùng đất hùng vĩ nổi tiếng với lớp đất bazan màu mỡ và được mệnh danh là thủ phủ của cà phê thượng hạng. Nơi đại ngàn hùng tráng lưu giữ chiều sâu văn hóa cội nguồn và là nguồn cảm hứng nguyên bản nhất cho DeliVN.",
      image: {
        src: "/brand/story/01-ban-sac-tay-nguyen.jpg",
        alt: "Tranh gỗ nghệ thuật Tây Nguyên tái hiện nhà Rông, cồng chiêng, lửa trại lễ hội và voi giữa núi đồi cao nguyên đất đỏ",
        width: 1063,
        height: 458,
        badge: "01 / NGUỒN CẢM HỨNG BẢN SẮC",
        fit: "cover" as const,
        objectPosition: "center center",
      },
    },
    {
      id: "02",
      number: "02",
      name: "CÂU CHUYỆN DI SẢN",
      label: "02 · CÂU CHUYỆN DI SẢN",
      tagline: "TỪ HẠT CÀ PHÊ ĐẾN DI SẢN",
      title: "GẦN HƠN VỚI BẢN SẮC VIỆT",
      description:
        "Từ hạt cà phê cho đến những câu chuyện di sản. DeliVN mang những câu chuyện bản sắc Tây Nguyên Việt Nam đến với bạn gần hơn — kết nối tinh thần hồn hậu của con người và nét đẹp văn hóa truyền thống qua từng giọt cà phê phin đậm đà.",
      image: {
        src: "/brand/story/02-con-nguoi-di-san.jpg",
        alt: "Tranh phác họa chân dung người trẻ Việt đội nón lá, mang khăn rằn nâng ly cà phê phin truyền thống thơm nồng",
        width: 1264,
        height: 1264,
        badge: "02 / CON NGƯỜI & CÂU CHUYỆN DI SẢN",
        fit: "contain" as const,
        objectPosition: "center center",
      },
    },
    {
      id: "03",
      number: "03",
      name: "THÀNH PHẨM TÂM HUYẾT",
      label: "03 · THÀNH PHẨM TÂM HUYẾT",
      tagline: "QUY TRÌNH RANG XAY THỦ CÔNG",
      title: "MỖI HẠT CÀ PHÊ MỘT SỨ MỆNH",
      description:
        "Thông qua nguồn hạt cà phê được tuyển chọn tốt nhất cho đến quy trình rang xay thủ công cho ra mỗi hạt cà phê đều mang trong mình một sứ mệnh về bản sắc nơi đó — kết tinh thành phẩm hoàn hảo cho trải nghiệm thưởng thức của bạn.",
      image: {
        src: "/brand/story/03-thanh-pham.png",
        alt: "Hai dòng sản phẩm cà phê DELIVN Bản Cát và Bản Đen hoàn thiện cùng lá và hạt cà phê rang",
        width: 1448,
        height: 1086,
        badge: "03 / THÀNH PHẨM & TRẢI NGHIỆM DELIVN",
        fit: "contain" as const,
        objectPosition: "center center",
      },
    },
  ],
  closing: {
    headline: {
      line1: "TỪ HẠT CÀ PHÊ ĐẾN DI SẢN,",
      line2: "MỖI TÁCH CÀ PHÊ LÀ MỘT CÂU CHUYỆN BẢN SẮC.",
    },
    scrollCue: "TIẾP TỤC KHÁM PHÁ DELIVN ↓",
  },
} as const;

export const finalCtaContent = {
  eyebrow: "ĐẾN LÚC CHỌN GU CÀ PHÊ CỦA BẠN",
  headline: {
    main: "HAI DÒNG CÀ PHÊ",
    serif: "Chọn gu phù hợp với bạn.",
  },
  description:
    "Dù bạn tìm kiếm sự mạnh mẽ, rõ nét của Espresso hay nét đậm đà, gần gũi của cà phê pha phin, DELIVN có một lựa chọn phù hợp với nhịp thưởng thức của bạn.",
  cta: {
    label: "CHỌN CÀ PHÊ CỦA BẠN",
    href: "/san-pham",
  },
  footnote: {
    left: "01 / ESPRESSO",
    right: "02 / PHA PHIN TRUYỀN THỐNG",
  },
  productImage: {
    src: "/products/hero/delivn-hero-products.png",
    alt: "DELIVN Cà Phê Hạt Rang Espresso và Cà Phê Rang Xay",
    width: 1024,
    height: 1024,
    caption: {
      espresso: "01 · CÀ PHÊ HẠT RANG ESPRESSO",
      rangXay: "02 · CÀ PHÊ RANG XAY",
    },
  },
} as const;

export const footerContent = {
  brandLine: "CÀ PHÊ VIỆT · ĐẬM DẤU ẤN TÂY NGUYÊN",
  summary:
    "DELIVN mang tinh thần cà phê Việt vào một trải nghiệm hiện đại, nơi hương vị, hình ảnh và cảm hứng Tây Nguyên cùng tạo nên bản sắc riêng.",
  tag: "TÂY NGUYÊN · VIETNAM",
  navigation: [
    { label: "TRANG CHỦ", href: "/" },
    { label: "SẢN PHẨM", href: "/san-pham" },
  ],
  copyright: "© 2026 DELIVN.",
} as const;
