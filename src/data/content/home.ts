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
  eyebrow: "NGUỒN CẢM HỨNG",
  headline: {
    line1: "TÂY NGUYÊN,",
    line2: "KHÔNG CHỈ LÀ MỘT VÙNG ĐẤT.",
  },
  sublead:
    "Đó là nơi DELIVN tìm thấy cảm hứng cho màu sắc, hình ảnh và tinh thần của một trải nghiệm cà phê Việt hiện đại.",
  steps: [
    {
      id: "01",
      number: "01",
      name: "VÙNG ĐẤT",
      label: "01 · VÙNG ĐẤT",
      title: "NƠI CẢM HỨNG BẮT ĐẦU",
      description:
        "Tây Nguyên gợi mở một không gian rộng lớn, mạnh mẽ nhưng gần gũi — nơi thiên nhiên, màu sắc và nhịp sống trở thành nguồn cảm hứng đầu tiên cho thế giới thị giác của DELIVN.",
      image: {
        src: "/brand/story/01-vung-dat.png",
        alt: "Khung cảnh cao nguyên Tây Nguyên với những ngọn đồi xanh và mặt hồ trải rộng",
        width: 1586,
        height: 992,
        badge: "01 / NGUỒN CẢM HỨNG THIÊN NHIÊN",
        objectPosition: "center center",
      },
    },
    {
      id: "02",
      number: "02",
      name: "CÂY CÀ PHÊ",
      label: "02 · CÂY CÀ PHÊ",
      title: "TỪ CÂY ĐẾN HẠT",
      description:
        "Từ những cành cà phê trĩu quả, hành trình thưởng thức bắt đầu từ một nguyên liệu gần gũi nhưng giàu sắc thái. Màu xanh của lá, sắc đỏ của quả chín và những chuyển biến tự nhiên trở thành một phần trong cảm hứng kể chuyện của DELIVN.",
      image: {
        src: "/brand/story/02-cay-ca-phe.png",
        alt: "Những chùm quả cà phê chín mọng trên cành cây tại vùng trồng",
        width: 1586,
        height: 992,
        badge: "02 / NGUYÊN LIỆU & SẮC THÁI",
        objectPosition: "center center",
      },
    },
    {
      id: "03",
      number: "03",
      name: "THÀNH PHẨM",
      label: "03 · THÀNH PHẨM",
      title: "TINH THẦN ĐƯỢC HOÀN THIỆN",
      description:
        "Từ cảm hứng về vùng đất và cây cà phê, DELIVN chuyển hóa những sắc thái ấy thành một ngôn ngữ hiện đại — từ hương vị, màu sắc đến cách sản phẩm hiện diện trong từng chi tiết bao bì.",
      image: {
        src: "/brand/story/03-thanh-pham.png",
        alt: "Hai dòng sản phẩm cà phê DELIVN Bản Cát và Bản Đen hoàn thiện cùng lá và hạt cà phê rang",
        width: 1448,
        height: 1086,
        badge: "03 / THIẾT KẾ & TRẢI NGHIỆM DELIVN",
        objectPosition: "center 35%",
      },
    },
  ],
  closing: {
    headline: {
      line1: "TỪ CẢM HỨNG TÂY NGUYÊN,",
      line2: "DELIVN KỂ TIẾP CÂU CHUYỆN CÀ PHÊ VIỆT.",
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
  company: {
    name: "CÔNG TY TNHH CÀ PHÊ DELIVN",
    mst: "3703119501",
    address:
      "Ô 32, Lô H37, Đường NH15, Khu dân cư Ấp 6, Khu phố 1, Phường Thới Hòa, Thành phố Hồ Chí Minh, Việt Nam",
    phone: "0961122226",
  },
  navigation: [
    { label: "SẢN PHẨM", href: "/san-pham" },
    { label: "CÂU CHUYỆN", href: "/cau-chuyen" },
    { label: "CÁCH PHA", href: "/cach-pha" },
    { label: "LIÊN HỆ", href: "/lien-he" },
  ],
  copyright: "© 2026 DELIVN.",
} as const;
