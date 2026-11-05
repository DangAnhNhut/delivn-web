export type ContactChannelLogo = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type ContactChannelBase = {
  id: string;
  platform: string;
  displayName: string;
  group: "social" | "shop";
  logo: ContactChannelLogo;
};

export type ActiveContactChannel = ContactChannelBase & {
  status: "active";
  href: string;
  actionLabel: string;
};

export type PendingContactChannel = ContactChannelBase & {
  status: "pending";
  statusLabel: "ĐANG CẬP NHẬT";
};

export type ContactChannel = ActiveContactChannel | PendingContactChannel;

export const CONTACT_CHANNELS = [
  {
    id: "youtube",
    platform: "YouTube",
    displayName: "DELIVN Coffee",
    group: "social",
    status: "active",
    href: "https://www.youtube.com/channel/UCsMjU0JedzxRGd3h1YBf_Fw",
    actionLabel: "XEM KÊNH",
    logo: {
      src: "/brands/social/youtube.png",
      alt: "YouTube logo",
      width: 1255,
      height: 1075,
    },
  },
  {
    id: "instagram",
    platform: "Instagram",
    displayName: "@delivncoffee",
    group: "social",
    status: "active",
    href: "https://www.instagram.com/delivncoffee/",
    actionLabel: "THEO DÕI",
    logo: {
      src: "/brands/social/instagram.svg",
      alt: "Instagram logo",
      width: 1000,
      height: 1000,
    },
  },
  {
    id: "facebook",
    platform: "Facebook",
    displayName: "DELIVN Coffee",
    group: "social",
    status: "active",
    href: "https://www.facebook.com/delivncoffee",
    actionLabel: "THEO DÕI",
    logo: {
      src: "/brands/social/facebook.png",
      alt: "Facebook logo",
      width: 2084,
      height: 2084,
    },
  },
  {
    id: "tiktok-shop",
    platform: "TikTok Shop",
    displayName: "TikTok Shop",
    group: "shop",
    status: "pending",
    statusLabel: "ĐANG CẬP NHẬT",
    logo: {
      src: "/brands/social/tiktok.png",
      alt: "TikTok Shop platform logo",
      width: 1200,
      height: 1200,
    },
  },
  {
    id: "shopee",
    platform: "Shopee",
    displayName: "Shopee",
    group: "shop",
    status: "pending",
    statusLabel: "ĐANG CẬP NHẬT",
    logo: {
      src: "/brands/social/shopee.png",
      alt: "Shopee platform logo",
      width: 96,
      height: 96,
    },
  },
] as const satisfies readonly ContactChannel[];
