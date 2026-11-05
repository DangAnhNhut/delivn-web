import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertDecision19Snapshot,
  buildAdministrativeDataset,
  parseAdministrativeSourceTsv,
  serializeAdministrativeDataset,
} from "../../scripts/generate-vietnam-administrative-units";

const shuffledSource = [
  "level\tcode\tname\tprovinceCode\ttype",
  "commune\t00008\tPhường Ngọc Hà\t01\tphường",
  "province\t79\tThành phố Hồ Chí Minh\t\tthành phố",
  "commune\t00004\tPhường Ba Đình\t01\tphường",
  "province\t01\tThành phố Hà Nội\t\tthành phố",
  "commune\t26734\tPhường Sài Gòn\t79\tphường",
].join("\n");

describe("Vietnam administrative dataset generation", () => {
  it("parses strict rows and preserves leading-zero codes", () => {
    const rows = parseAdministrativeSourceTsv(shuffledSource);

    expect(rows).toContainEqual({
      level: "commune",
      code: "00004",
      name: "Phường Ba Đình",
      provinceCode: "01",
      type: "phường",
    });
  });

  it.each([
    ["an unexpected header", shuffledSource.replace("level\t", "kind\t")],
    ["a district row", `${shuffledSource}\ndistrict\t001\tQuận Demo\t01\tquận`],
    ["a malformed province code", shuffledSource.replace("province\t01", "province\t1")],
    ["a malformed commune code", shuffledSource.replace("commune\t00004", "commune\t004")],
    ["an unknown unit type", shuffledSource.replace("phường\n", "thị trấn\n")],
    ["an extra column", shuffledSource.replace("\tthành phố", "\tthành phố\textra")],
  ])("rejects %s", (_caseName, source) => {
    expect(() => parseAdministrativeSourceTsv(source)).toThrow();
  });

  it("rejects duplicate codes and missing province parents", () => {
    const duplicate = `${shuffledSource}\ncommune\t00004\tPhường Trùng\t01\tphường`;
    const missingParent = shuffledSource.replace("commune\t26734\tPhường Sài Gòn\t79", "commune\t26734\tPhường Sài Gòn\t80");

    expect(() => buildAdministrativeDataset(parseAdministrativeSourceTsv(duplicate))).toThrow(
      /duplicate commune code/i,
    );
    expect(() => buildAdministrativeDataset(parseAdministrativeSourceTsv(missingParent))).toThrow(
      /unknown province/i,
    );
  });

  it("serializes deterministically in canonical code order", () => {
    const rows = parseAdministrativeSourceTsv(shuffledSource);
    const reversed = [...rows].reverse();

    const first = serializeAdministrativeDataset(buildAdministrativeDataset(rows));
    const second = serializeAdministrativeDataset(buildAdministrativeDataset(reversed));

    expect(second).toBe(first);
    expect(first.endsWith("\n")).toBe(true);
    expect(first.indexOf('"code": "01"')).toBeLessThan(first.indexOf('"code": "79"'));
    expect(first.indexOf('"code": "00004"')).toBeLessThan(first.indexOf('"code": "00008"'));
    expect(first.indexOf('"code": "00008"')).toBeLessThan(first.indexOf('"code": "26734"'));
  });

  it("requires the deliberate Decision 19 record counts", () => {
    const dataset = buildAdministrativeDataset(parseAdministrativeSourceTsv(shuffledSource));

    expect(() => assertDecision19Snapshot(dataset)).toThrow(/34 provinces and 3321 communes/i);
  });

  it("keeps the checked-in generated JSON byte-identical to the official TSV", () => {
    const source = readFileSync(
      resolve("data/official/decision-19-2025-administrative-units.tsv"),
      "utf8",
    );
    const checkedIn = readFileSync(
      resolve("src/data/vietnam-administrative-units.generated.json"),
      "utf8",
    ).replaceAll("\r\n", "\n");
    const dataset = buildAdministrativeDataset(parseAdministrativeSourceTsv(source));

    assertDecision19Snapshot(dataset);
    expect(checkedIn).toBe(serializeAdministrativeDataset(dataset));
  });
});
