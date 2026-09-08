import assert from "node:assert/strict";
import test from "node:test";
import {
  applyWindowsTerminalCompatibility,
  shouldClearShrunkRows,
} from "../../../extensions/windows-terminal-compat/index.ts";

test("enables shrink cleanup for the Windows regular renderer", () => {
  assert.equal(shouldClearShrunkRows("win32", "regular"), true);

  let enabled: boolean | undefined;
  applyWindowsTerminalCompatibility(
    {
      mode: "regular",
      setClearOnShrink(value) {
        enabled = value;
      },
    },
    "win32",
  );

  assert.equal(enabled, true);
});

test("does not change non-Windows or fullscreen rendering", () => {
  assert.equal(shouldClearShrunkRows("linux", "regular"), false);
  assert.equal(shouldClearShrunkRows("win32", "fullscreen"), false);

  let calls = 0;
  const tui = {
    mode: "fullscreen" as const,
    setClearOnShrink() {
      calls += 1;
    },
  };

  applyWindowsTerminalCompatibility(tui, "win32");
  applyWindowsTerminalCompatibility({ ...tui, mode: "regular" }, "linux");

  assert.equal(calls, 0);
});

test("supports an explicit environment opt-out", () => {
  assert.equal(shouldClearShrunkRows("win32", "regular", false), false);

  let calls = 0;
  applyWindowsTerminalCompatibility(
    {
      mode: "regular",
      setClearOnShrink() {
        calls += 1;
      },
    },
    "win32",
    false,
  );

  assert.equal(calls, 0);
});
