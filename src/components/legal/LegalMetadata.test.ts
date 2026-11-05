import { describe, expect, it } from "vitest";

import { metadata as privacyMetadata } from "@/app/(storefront)/chinh-sach-bao-mat/page";
import { metadata as returnsMetadata } from "@/app/(storefront)/chinh-sach-doi-tra-hoan-tien/page";
import { metadata as paymentMetadata } from "@/app/(storefront)/chinh-sach-thanh-toan/page";
import { metadata as shippingMetadata } from "@/app/(storefront)/chinh-sach-van-chuyen/page";
import { metadata as termsMetadata } from "@/app/(storefront)/dieu-khoan-giao-dich/page";
import { metadata as contactMetadata } from "@/app/(storefront)/lien-he/page";
import { metadata as businessMetadata } from "@/app/(storefront)/thong-tin-doanh-nghiep/page";

const routeMetadata = [
  contactMetadata,
  businessMetadata,
  termsMetadata,
  privacyMetadata,
  paymentMetadata,
  shippingMetadata,
  returnsMetadata,
];

describe("compliance route metadata", () => {
  it("composes with the root title template without a duplicate DELIVN suffix", () => {
    for (const metadata of routeMetadata) {
      expect(typeof metadata.title).toBe("string");
      const resolvedTitle = `%s | DELIVN`.replace("%s", metadata.title as string);
      expect(resolvedTitle).not.toContain("| DELIVN | DELIVN");
      expect(resolvedTitle.match(/DELIVN/g)).toHaveLength(1);
    }
  });
});
