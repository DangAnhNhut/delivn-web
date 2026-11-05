import { describe, expect, it } from "vitest";

import {
  VIETNAM_ADMINISTRATIVE_DATA_METADATA,
  VIETNAM_COMMUNES,
  VIETNAM_PROVINCES,
  getCommuneByCode,
  getCommunesByProvinceCode,
  getProvinceByCode,
  isCommuneInProvince,
  normalizeVietnameseSearchText,
  searchAdministrativeOptions,
} from "./vietnam-administrative-units";

describe("Decision 19 administrative data", () => {
  it("exposes the deliberate two-level official snapshot", () => {
    expect(VIETNAM_ADMINISTRATIVE_DATA_METADATA).toMatchObject({
      decisionNumber: "19/2025/QD-TTg",
      issuedDate: "2025-06-30",
      effectiveDate: "2025-07-01",
      provinceCount: 34,
      communeCount: 3_321,
    });
    expect(VIETNAM_PROVINCES).toHaveLength(34);
    expect(VIETNAM_COMMUNES).toHaveLength(3_321);
    expect(Object.keys(VIETNAM_ADMINISTRATIVE_DATA_METADATA)).not.toContain("districtCount");
  });

  it("keeps codes unique, fixed-width, parented, and district-free", () => {
    expect(new Set(VIETNAM_PROVINCES.map(({ code }) => code)).size).toBe(34);
    expect(new Set(VIETNAM_COMMUNES.map(({ code }) => code)).size).toBe(3_321);
    expect(VIETNAM_PROVINCES.every(({ code }) => /^\d{2}$/.test(code))).toBe(true);
    expect(VIETNAM_COMMUNES.every(({ code }) => /^\d{5}$/.test(code))).toBe(true);
    expect(
      VIETNAM_COMMUNES.every(({ provinceCode }) => getProvinceByCode(provinceCode)),
    ).toBe(true);
    expect(VIETNAM_COMMUNES.some((unit) => "districtCode" in unit)).toBe(false);
  });

  it("contains only the approved unit types, including every allowed type", () => {
    expect(new Set(VIETNAM_PROVINCES.map(({ type }) => type))).toEqual(
      new Set(["tỉnh", "thành phố"]),
    );
    expect(new Set(VIETNAM_COMMUNES.map(({ type }) => type))).toEqual(
      new Set(["phường", "xã", "đặc khu"]),
    );
  });

  it("resolves official lookups and province relationships", () => {
    expect(getProvinceByCode("01")?.name).toBe("Thành phố Hà Nội");
    expect(getCommuneByCode("00004")).toMatchObject({
      name: "Phường Ba Đình",
      provinceCode: "01",
    });
    expect(getProvinceByCode("1")).toBeUndefined();
    expect(getCommuneByCode("99999")).toBeUndefined();
    expect(isCommuneInProvince("00004", "01")).toBe(true);
    expect(isCommuneInProvince("00004", "79")).toBe(false);
    expect(getCommunesByProvinceCode("79")).toContainEqual(
      expect.objectContaining({ code: "26740", name: "Phường Sài Gòn" }),
    );
    expect(getCommunesByProvinceCode("99")).toEqual([]);
  });

  it("does not expose mutable canonical collections", () => {
    expect(Object.isFrozen(VIETNAM_PROVINCES)).toBe(true);
    expect(Object.isFrozen(VIETNAM_COMMUNES)).toBe(true);
    expect(Object.isFrozen(VIETNAM_PROVINCES[0])).toBe(true);
    expect(Object.isFrozen(VIETNAM_COMMUNES[0])).toBe(true);
  });
});

describe("Vietnamese administrative search", () => {
  const options = [
    { code: "01", name: "Thành phố Hà Nội" },
    { code: "48", name: "Thành phố Đà Nẵng" },
    { code: "66", name: "Tỉnh Đắk Lắk" },
  ] as const;

  it("normalizes case, accents, đ, and repeated whitespace", () => {
    expect(normalizeVietnameseSearchText("  ĐẮK   Lắk ")).toBe("dak lak");
  });

  it("filters by accent-insensitive case-insensitive substrings", () => {
    expect(searchAdministrativeOptions(options, "da nang")).toEqual([
      { code: "48", name: "Thành phố Đà Nẵng" },
    ]);
    expect(searchAdministrativeOptions(options, "DAK")).toEqual([
      { code: "66", name: "Tỉnh Đắk Lắk" },
    ]);
  });

  it("keeps canonical ordering for empty queries and does not mutate input", () => {
    const before = [...options];

    expect(searchAdministrativeOptions(options, "   ")).toEqual(options);
    expect(options).toEqual(before);
  });
});
