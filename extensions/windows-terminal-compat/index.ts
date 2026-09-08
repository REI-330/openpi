import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import {
  registerEditorLayer,
  removeEditorLayer,
} from "../shared/editor-layers.ts";

export const WINDOWS_TERMINAL_COMPAT_LAYER = "windows-terminal-compat";
export const WINDOWS_TERMINAL_COMPAT_ENV = "OPENPI_WINDOWS_TUI_COMPAT";

export function shouldClearShrunkRows(
  platform: NodeJS.Platform,
  mode: "regular" | "fullscreen",
  enabled = true,
) {
  return enabled && platform === "win32" && mode === "regular";
}

export function applyWindowsTerminalCompatibility(
  tui: {
    mode: "regular" | "fullscreen";
    setClearOnShrink(enabled: boolean): void;
  },
  platform: NodeJS.Platform,
  enabled = true,
) {
  if (shouldClearShrunkRows(platform, tui.mode, enabled)) {
    tui.setClearOnShrink(true);
  }
}

function install(ctx: ExtensionContext, pi: ExtensionAPI) {
  if (ctx.mode !== "tui" || process.env[WINDOWS_TERMINAL_COMPAT_ENV] === "0") {
    return;
  }

  registerEditorLayer(pi, ctx, {
    id: WINDOWS_TERMINAL_COMPAT_LAYER,
    order: 100,
    wrap: (base, tui) => {
      // The regular renderer otherwise leaves rows behind when autocomplete
      // shrinks. This is a terminal redraw compatibility setting, not an
      // editor replacement, so all existing input behavior remains intact.
      applyWindowsTerminalCompatibility(
        tui,
        process.platform,
        process.env[WINDOWS_TERMINAL_COMPAT_ENV] !== "0",
      );
      return base;
    },
  });
}

export default function windowsTerminalCompat(pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => install(ctx, pi));
  pi.on("session_shutdown", () => {
    removeEditorLayer(pi, WINDOWS_TERMINAL_COMPAT_LAYER);
  });
}
