import rawData from "./vietnam-administrative-units.generated.json";

export type ProvinceAdministrativeUnit = Readonly<{
  code: string;
  name: string;
  type: "tỉnh" | "thành phố";
}>;

export type CommuneAdministrativeUnit = Readonly<{
  code: string;
  name: string;
  provinceCode: string;
  type: "phường" | "xã" | "đặc khu";
}>;

export type AdministrativeOption = Readonly<{
  code: string;
  name: string;
}>;

type AdministrativeDataFile = {
  metadata: {
    decisionNumber: string;
    issuedDate: string;
    effectiveDate: string;
    provinceCount: number;
    communeCount: number;
    sourceUrl: string;
  };
  provinces: ProvinceAdministrativeUnit[];
  communes: CommuneAdministrativeUnit[];
};

const data = rawData as AdministrativeDataFile;

export const VIETNAM_ADMINISTRATIVE_DATA_METADATA = Object.freeze({ ...data.metadata });
export const VIETNAM_PROVINCES: readonly ProvinceAdministrativeUnit[] = Object.freeze(
  data.provinces.map((province) => Object.freeze({ ...province })),
);
export const VIETNAM_COMMUNES: readonly CommuneAdministrativeUnit[] = Object.freeze(
  data.communes.map((commune) => Object.freeze({ ...commune })),
);

const provincesByCode = new Map(VIETNAM_PROVINCES.map((province) => [province.code, province]));
const communesByCode = new Map(VIETNAM_COMMUNES.map((commune) => [commune.code, commune]));
const mutableCommunesByProvince = new Map<string, CommuneAdministrativeUnit[]>();

for (const commune of VIETNAM_COMMUNES) {
  const provinceCommunes = mutableCommunesByProvince.get(commune.provinceCode) ?? [];
  provinceCommunes.push(commune);
  mutableCommunesByProvince.set(commune.provinceCode, provinceCommunes);
}

const communesByProvince = new Map(
  [...mutableCommunesByProvince].map(([code, communes]) => [code, Object.freeze(communes)]),
);
const EMPTY_COMMUNES: readonly CommuneAdministrativeUnit[] = Object.freeze([]);

export function getProvinceByCode(code: string): ProvinceAdministrativeUnit | undefined {
  return provincesByCode.get(code);
}

export function getCommuneByCode(code: string): CommuneAdministrativeUnit | undefined {
  return communesByCode.get(code);
}

export function getCommunesByProvinceCode(
  provinceCode: string,
): readonly CommuneAdministrativeUnit[] {
  return communesByProvince.get(provinceCode) ?? EMPTY_COMMUNES;
}

export function isCommuneInProvince(communeCode: string, provinceCode: string): boolean {
  return communesByCode.get(communeCode)?.provinceCode === provinceCode;
}

export function normalizeVietnameseSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replaceAll("đ", "d")
    .replace(/\s+/g, " ");
}

export function searchAdministrativeOptions<T extends AdministrativeOption>(
  options: readonly T[],
  query: string,
): readonly T[] {
  const normalizedQuery = normalizeVietnameseSearchText(query);
  if (!normalizedQuery) return options;
  return options.filter((option) =>
    normalizeVietnameseSearchText(option.name).includes(normalizedQuery),
  );
}
