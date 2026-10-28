import { useEffect, useState } from "react";

export type ExtensionUiSlot = "top-nav" | "settings-nav";

export interface ExtensionUiConfig {
  placement: {
    slot: ExtensionUiSlot;
    label: string;
  };
  remote?: {
    /** URL of the Module Federation remoteEntry.js file. */
    entry: string;
    /** The global container name exposed by the remote build. */
    scope: string;
    /** Exposed module name, e.g. "./App". */
    module: string;
  };
}

type ExtensionUiRegistry = Record<string, ExtensionUiConfig>;

const STORAGE_KEY = "sealman.extension-ui-registry";
const CHANGE_EVENT = "sealman:extension-ui-registry-changed";

function isUiConfig(value: unknown): value is ExtensionUiConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as Partial<ExtensionUiConfig>;
  if (
    !config.placement ||
    (config.placement.slot !== "top-nav" && config.placement.slot !== "settings-nav") ||
    typeof config.placement.label !== "string"
  ) return false;

  return config.remote === undefined || (
    !!config.remote &&
    typeof config.remote.entry === "string" &&
    typeof config.remote.scope === "string" &&
    typeof config.remote.module === "string"
  );
}

export function readExtensionUiRegistry(): ExtensionUiRegistry {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([, value]) => isUiConfig(value)),
    ) as ExtensionUiRegistry;
  } catch {
    return {};
  }
}

/**
 * UI metadata is intentionally kept separate from the backend registration payload,
 * because the current ExtensionRegistration API schema does not define a `ui` field.
 * This browser-local registry is a frontend-only bridge until the backend persists it.
 */
export function saveExtensionUiConfig(name: string, config: ExtensionUiConfig | null): void {
  if (typeof window === "undefined") return;
  const registry = readExtensionUiRegistry();
  if (config && isUiConfig(config)) registry[name] = config;
  else delete registry[name];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getExtensionUiConfig(name: string): ExtensionUiConfig | undefined {
  return readExtensionUiRegistry()[name];
}

export function useExtensionUiRegistry(): ExtensionUiRegistry {
  const [registry, setRegistry] = useState<ExtensionUiRegistry>(() => readExtensionUiRegistry());

  useEffect(() => {
    const refresh = () => setRegistry(readExtensionUiRegistry());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return registry;
}

/** Read the optional `ui` block from an imported registration manifest. */
export function uiConfigFromManifest(value: unknown): ExtensionUiConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const ui = (value as { ui?: unknown }).ui;
  return isUiConfig(ui) ? ui : null;
}
