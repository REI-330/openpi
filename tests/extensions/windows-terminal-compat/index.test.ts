import assert from "node:assert/strict";
import test from "node:test";
import {
  applyWindowsTerminalCompatibility,
  installWindowsTerminalCompatibilityListener,
  shouldClearShrunkRows,
} from "../../../extensions/windows-terminal-compat/index.ts";

test("enables shrink cleanup for the Windows regular renderer", () => {
  assert.equal(shouldClearShrunkRows("win32", "regular"), true);

  let enabled: boolean | undefined;
  applyWindowsTerminalCompatibility(
    {
      mode: "regular",
      getClearOnShrink() {
        return false;
      },
      setClearOnShrink(value) {
        enabled = value;
      },
      addInputListener() {
        return () => {};
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
    getClearOnShrink() {
      return false;
    },
    setClearOnShrink() {
      calls += 1;
    },
    addInputListener() {
      return () => {};
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
      getClearOnShrink() {
        return false;
      },
      setClearOnShrink() {
        calls += 1;
      },
      addInputListener() {
        return () => {};
      },
    },
    "win32",
    false,
  );

  assert.equal(calls, 0);
});

test("preserves an already enabled or explicitly disabled renderer setting", () => {
  let calls = 0;
  applyWindowsTerminalCompatibility(
    {
      mode: "regular",
      getClearOnShrink() {
        return true;
      },
      setClearOnShrink() {
        calls += 1;
      },
      addInputListener() {
        return () => {};
      },
    },
    "win32",
  );
  assert.equal(calls, 0);
});

test("reapplies compatibility when the stable TUI switches to regular mode", () => {
  let mode: "regular" | "fullscreen" = "fullscreen";
  let clearOnShrink = false;
  let listener: ((data: string) => unknown) | undefined;
  const remove = installWindowsTerminalCompatibilityListener(
    {
      get mode() {
        return mode;
      },
      getClearOnShrink() {
        return clearOnShrink;
      },
      setClearOnShrink(value) {
        clearOnShrink = value;
      },
      addInputListener(value) {
        listener = value;
        return () => {
          listener = undefined;
        };
      },
    },
    "win32",
  );

  listener?.("input");
  assert.equal(clearOnShrink, false);
  mode = "regular";
  listener?.("input");
  assert.equal(clearOnShrink, true);
  remove();
  assert.equal(listener, undefined);
});
