import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type AdministrativeSourceRow = {
  level: "province" | "commune";
  code: string;
  name: string;
  provinceCode: string;
  type: "tỉnh" | "thành phố" | "phường" | "xã" | "đặc khu";
};

export type VietnamAdministrativeDataset = {
  metadata: {
    decisionNumber: "19/2025/QD-TTg";
    issuedDate: "2025-06-30";
    effectiveDate: "2025-07-01";
    provinceCount: number;
    communeCount: number;
    sourceUrl: string;
  };
  provinces: Array<{
    code: string;
    name: string;
    type: "tỉnh" | "thành phố";
  }>;
  communes: Array<{
    code: string;
    name: string;
    provinceCode: string;
    type: "phường" | "xã" | "đặc khu";
  }>;
};

const SOURCE_HEADER = "level\tcode\tname\tprovinceCode\ttype";
const PROVINCE_TYPES = new Set(["tỉnh", "thành phố"]);
const COMMUNE_TYPES = new Set(["phường", "xã", "đặc khu"]);

export function parseAdministrativeSourceTsv(source: string): AdministrativeSourceRow[] {
  const lines = source.replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
  if (lines[0] !== SOURCE_HEADER) throw new Error(`Unexpected TSV header: ${lines[0] ?? ""}`);

  return lines.slice(1).map((line, index) => {
    const columns = line.split("\t");
    if (columns.length !== 5) throw new Error(`Malformed TSV row ${index + 2}`);
    const [level, code, name, provinceCode, type] = columns;
    if (level !== "province" && level !== "commune") {
      throw new Error(`Unknown administrative level at row ${index + 2}: ${level}`);
    }
    if (!name || name !== name.trim()) throw new Error(`Invalid name at row ${index + 2}`);

    if (level === "province") {
      if (!/^\d{2}$/.test(code) || provinceCode !== "" || !PROVINCE_TYPES.has(type)) {
        throw new Error(`Invalid province row ${index + 2}`);
      }
    } else if (!/^\d{5}$/.test(code) || !/^\d{2}$/.test(provinceCode) || !COMMUNE_TYPES.has(type)) {
      throw new Error(`Invalid commune row ${index + 2}`);
    }

    return { level, code, name, provinceCode, type } as AdministrativeSourceRow;
  });
}

export function buildAdministrativeDataset(
  rows: readonly AdministrativeSourceRow[],
): VietnamAdministrativeDataset {
  const provinceCodes = new Set<string>();
  const communeCodes = new Set<string>();

  const provinces = rows
    .filter((row): row is AdministrativeSourceRow & { level: "province"; type: "tỉnh" | "thành phố" } => row.level === "province")
    .map(({ code, name, type }) => {
      if (provinceCodes.has(code)) throw new Error(`Duplicate province code: ${code}`);
      provinceCodes.add(code);
      return { code, name, type };
    })
    .sort((left, right) => left.code.localeCompare(right.code, "en"));

  const communes = rows
    .filter((row): row is AdministrativeSourceRow & { level: "commune"; type: "phường" | "xã" | "đặc khu" } => row.level === "commune")
    .map(({ code, name, provinceCode, type }) => {
      if (communeCodes.has(code)) throw new Error(`Duplicate commune code: ${code}`);
      communeCodes.add(code);
      if (!provinceCodes.has(provinceCode)) {
        throw new Error(`Commune ${code} references unknown province ${provinceCode}`);
      }
      return { code, name, provinceCode, type };
    })
    .sort(
      (left, right) =>
        left.provinceCode.localeCompare(right.provinceCode, "en") ||
        left.code.localeCompare(right.code, "en"),
    );

  return {
    metadata: {
      decisionNumber: "19/2025/QD-TTg",
      issuedDate: "2025-06-30",
      effectiveDate: "2025-07-01",
      provinceCount: provinces.length,
      communeCount: communes.length,
      sourceUrl:
        "https://www.nso.gov.vn/wp-content/uploads/2025/07/19_2025_qd-ttg_30062025-signed-6-143-da-nen.pdf",
    },
    provinces,
    communes,
  };
}

export function assertDecision19Snapshot(dataset: VietnamAdministrativeDataset): void {
  if (dataset.provinces.length !== 34 || dataset.communes.length !== 3_321) {
    throw new Error(
      `Decision 19 snapshot must contain 34 provinces and 3321 communes; received ${dataset.provinces.length} and ${dataset.communes.length}.`,
    );
  }
}

export function serializeAdministrativeDataset(dataset: VietnamAdministrativeDataset): string {
  return `${JSON.stringify(dataset, null, 2)}\n`;
}

function run(): void {
  const sourcePath = resolve("data/official/decision-19-2025-administrative-units.tsv");
  const outputPath = resolve("src/data/vietnam-administrative-units.generated.json");
  const dataset = buildAdministrativeDataset(
    parseAdministrativeSourceTsv(readFileSync(sourcePath, "utf8")),
  );
  assertDecision19Snapshot(dataset);
  writeFileSync(outputPath, serializeAdministrativeDataset(dataset), "utf8");
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) run();
