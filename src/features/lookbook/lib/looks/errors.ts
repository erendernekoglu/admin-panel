export type EditorialErrorCode =
  | "validation"
  | "not_found"
  | "forbidden"
  | "conflict"
  | "idempotency_conflict"
  | "code_collision"
  | "integrity";

export class EditorialError extends Error {
  readonly code: EditorialErrorCode; readonly field?: string;
  constructor(
    code: EditorialErrorCode,
    message: string,
    field?: string,
  ) {
    super(message); this.code = code; this.field = field;
    this.name = "EditorialError";
  }
}

export function assertDocumentId(
  value: unknown,
  field = "id",
): asserts value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value) || value !== value.trim()) {
    throw new EditorialError("validation", "Expected a document ID of 1–128 ASCII letters, digits, underscores or hyphens.", field);
  }
}
