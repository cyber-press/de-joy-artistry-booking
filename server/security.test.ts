import test from "node:test";
import assert from "node:assert/strict";
import { passwordPolicy } from "./auth.js";
import { safeRequestId } from "./security.js";

test("safeRequestId keeps safe IDs and replaces hostile values", () => {
  assert.equal(safeRequestId("deploy:request-123"), "deploy:request-123");
  assert.match(safeRequestId("bad id\nheader"), /^[0-9a-f-]{36}$/);
  assert.match(safeRequestId("x".repeat(81)), /^[0-9a-f-]{36}$/);
});

test("owner password policy requires length and character variety", () => {
  assert.equal(passwordPolicy("ShortPassword1"), false);
  assert.equal(passwordPolicy("alllowercasepassword1"), false);
  assert.equal(passwordPolicy("StrongOwnerPassword2026"), true);
});
