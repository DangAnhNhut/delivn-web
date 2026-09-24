export class CommerceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ServerConfigurationError extends CommerceError {
  constructor() {
    super("SERVER_CONFIGURATION_ERROR", "Server configuration is unavailable.", 500);
  }
}

export class CheckoutValidationError extends CommerceError {
  constructor(message = "Checkout input is invalid.", details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

export class MoneyLimitError extends CommerceError {
  constructor() {
    super(
      "ORDER_VALUE_LIMIT_EXCEEDED",
      "Order value exceeds supported limits.",
      422,
    );
  }
}

export class ItemUnavailableError extends CommerceError {
  constructor() {
    super("ITEM_UNAVAILABLE", "One or more items are unavailable.", 409);
  }
}

export class InsufficientInventoryError extends CommerceError {
  constructor() {
    super("INSUFFICIENT_INVENTORY", "Insufficient inventory.", 409);
  }
}

export class SeedConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeedConfigurationError";
  }
}

export class SeedIdentityConflictError extends Error {
  constructor(identity: string) {
    super(`Development seed identity conflict: ${identity}. Existing data was not changed.`);
    this.name = "SeedIdentityConflictError";
  }
}
