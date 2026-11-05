# Vietnam administrative address data source

## Authority and scope

The checkout snapshot implements the two-level administrative code system in Decision 19/2025/QD-TTg, issued by the Prime Minister on 30 June 2025 and effective 1 July 2025.

- Government decision record: <https://vanban.chinhphu.vn/?classid=1&docid=214409&orggroupid=3&pageid=27160>
- Final signed Decision 19 appendix published by the National Statistics Office (NSO): <https://www.nso.gov.vn/wp-content/uploads/2025/07/19_2025_qd-ttg_30062025-signed-6-143-da-nen.pdf>
- Machine-readable NSO coded commune appendix used for extraction: <https://www.nso.gov.vn/wp-content/uploads/2025/06/Danh-sach-va-ma-so-cac-don-vi-hanh-chinh-cap-xa.pdf>

Decision 19 defines two independent levels: two-digit province-level codes and five-digit commune-level codes. The checked-in snapshot contains exactly 34 province-level units and 3,321 commune-level units. It deliberately contains no district layer.

The final signed PDF is an image-compressed publication. For deterministic extraction, the normalized source rows were read from the NSO's text-based coded appendix issued with Công văn 1027/CTK-CSCL on 25 June 2025, then validated against Decision 19's published structure, effective date, exact counts, province list, code widths, unique codes, and parent coverage. No unmatched source row was accepted.

## Extraction and transformation

Extraction date: 2026-11-05.

`data/official/decision-19-2025-administrative-units.tsv` is the normalized, reviewable source snapshot. Its columns are:

1. `level`: only `province` or `commune`;
2. `code`: fixed-width official string code;
3. `name`: official Vietnamese unit name including its administrative prefix;
4. `provinceCode`: blank for provinces and the canonical two-digit parent for communes;
5. `type`: `tỉnh`, `thành phố`, `phường`, `xã`, or `đặc khu`.

The extraction accepted a row only when all of these checks passed:

- ordinal sequence was exactly 1 through 3,321;
- commune code matched five digits and was unique;
- the province heading resolved to one of the 34 official province names/codes;
- the row's printed province column matched that heading;
- the unit name began with `Phường`, `Xã`, or `Đặc khu`;
- all 34 province codes were represented;
- zero rows remained unmatched.

No name or code is inferred, repaired, translated, or fetched at application runtime.

## Deterministic generation

Run:

```powershell
npm run data:generate:vn-address
```

The dependency-free generator validates every TSV row, rejects duplicates and missing parents, sorts provinces by code and communes by parent code then commune code, and writes stable two-space JSON with a single LF terminator.

Current checksums:

- normalized TSV SHA-256: `A834D3567B53D1C659A624407721975EF5D57766994A40117A370E99DD6A4527`
- generated JSON SHA-256: `F528D480F25188B9E04C491299C85ADEDE929A445A163D5E1C3956331AFF4349`

Focused tests regenerate the JSON in memory and require byte equality with the checked-in file. Any future official administrative change requires deliberate source review, checksum/count updates, regeneration, and test review; the application never silently adopts an unknown version.

## Review spot checks

- `01` — Thành phố Hà Nội; `00004` — Phường Ba Đình.
- `79` — Thành phố Hồ Chí Minh; `26740` — Phường Sài Gòn.
- `96` — Tỉnh Cà Mau; final source ordinal `3321`, code `31894` — Xã Châu Thới.
