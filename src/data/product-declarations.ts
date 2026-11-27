export interface ProductDeclarationDossier {
  readonly id: string;
  readonly indexLabel: string;
  readonly title: string;
  readonly declarationNumber: string;
  readonly declarationDate: string;
  readonly ingredients: string;
  readonly packaging: string;
  readonly pdfUrl: string;
  readonly downloadFileName: string;
  readonly pageCount: number;
}

export const PRODUCT_DECLARATION_DOSSIERS: readonly ProductDeclarationDossier[] = [
  {
    id: "ho-so-01",
    indexLabel: "HỒ SƠ SỐ 01",
    title: "CÀ PHÊ HẠT RANG ESPRESSO SPECIAL TÂY NGUYÊN VIETNAM",
    declarationNumber: "01/CÔNG TY TNHH CÀ PHÊ DELIVN/2026",
    declarationDate: "01/10/2026",
    ingredients: "100% cà phê (70% Robusta - 30% Arabica)",
    packaging: "250g và 500g",
    pdfUrl:
      "/documents/product-declarations/delivn-tu-cong-bo-01-ca-phe-hat-rang-espresso.pdf",
    downloadFileName: "delivn-tu-cong-bo-01-ca-phe-hat-rang-espresso.pdf",
    pageCount: 11,
  },
  {
    id: "ho-so-02",
    indexLabel: "HỒ SƠ SỐ 02",
    title: "CÀ PHÊ RANG XAY PHA PHIN TRUYỀN THỐNG TÂY NGUYÊN VIETNAM",
    declarationNumber: "02/CÔNG TY TNHH CÀ PHÊ DELIVN/2026",
    declarationDate: "01/10/2026",
    ingredients: "100% cà phê (90% Robusta - 10% Arabica)",
    packaging: "250g và 500g",
    pdfUrl:
      "/documents/product-declarations/delivn-tu-cong-bo-02-ca-phe-rang-xay-pha-phin.pdf",
    downloadFileName: "delivn-tu-cong-bo-02-ca-phe-rang-xay-pha-phin.pdf",
    pageCount: 11,
  },
] as const;

