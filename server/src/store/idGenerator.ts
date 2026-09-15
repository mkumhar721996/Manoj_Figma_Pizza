import { randomUUID } from "node:crypto";

export function generate(): string {
  return randomUUID();
}
