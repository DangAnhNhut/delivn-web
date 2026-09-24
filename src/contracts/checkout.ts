export type CheckoutInput = {
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    note?: string;
  };
  paymentMethod: "cod" | "bank_transfer";
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
};
