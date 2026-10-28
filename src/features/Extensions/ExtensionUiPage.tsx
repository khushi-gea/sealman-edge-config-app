import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useGetExtension } from "@/generated/edge-administration/hooks/useExtensions";
import { getExtensionUiConfig } from "./extensionUi";

type FederationModule = { default?: ComponentType<any> } | ComponentType<any>;
type FederationContainer = {
  init: (shareScope?: unknown) => Promise<void> | void;
  get: (moduleName: string) => Promise<() => FederationModule>;
};

declare global {
  interface Window {
    // Module Federation containers are registered on window by remoteEntry.js.
    [key: string]: unknown;
  }
}

const remoteLoads = new Map<string, Promise<void>>();

function ensureRemoteScript(entry: string, scope: string): Promise<void> {
  const current = (window as unknown as Record<string, unknown>)[scope];
  if (current) return Promise.resolve();

  const existing = remoteLoads.get(entry);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = entry;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load remote entry: ${entry}`));
    document.head.appendChild(script);
  });
  remoteLoads.set(entry, promise);
  return promise;
}

export default function ExtensionUiPage() {
  const { name = "" } = useParams<{ name: string }>();
  const { data: extension, isLoading: isExtensionLoading, isError } = useGetExtension(name);
  const config = getExtensionUiConfig(name);
  const [RemoteComponent, setRemoteComponent] = useState<ComponentType<any> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRemoteLoading, setIsRemoteLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setRemoteComponent(null);
    setLoadError(null);
    setIsRemoteLoading(true);

    async function load() {
      if (!config) {
        throw new Error(
          "This extension has no UI configuration in this browser. Register it with a ui block containing placement and remote entry details.",
        );
      }
      if (!config.remote) {
        throw new Error("The manifest defines a placement but no remote UI entry. Add ui.remote.entry, ui.remote.scope, and ui.remote.module to load the component.");
      }
      const remote = config.remote;
      await ensureRemoteScript(remote.entry, remote.scope);
      const container = (window as unknown as Record<string, unknown>)[remote.scope] as FederationContainer | undefined;
      if (!container) {
        throw new Error(`Remote container "${remote.scope}" was not found after loading the entry.`);
      }

      // This host currently has no Module Federation share-scope runtime configured.
      // Remotes should therefore bundle compatible dependencies or tolerate an empty scope.
      try {
        await container.init({});
      } catch (error) {
        // A container can throw when it has already been initialized.
        if (!(error instanceof Error) || !/already initialized/i.test(error.message)) throw error;
      }

      const factory = await container.get(remote.module);
      const loaded = factory();
      const component = typeof loaded === "function" ? loaded : loaded.default;
      if (!component) throw new Error(`Remote module "${remote.module}" has no default component export.`);
      if (!cancelled) setRemoteComponent(() => component as ComponentType<any>);
    }

    load()
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not load extension UI.");
      })
      .finally(() => {
        if (!cancelled) setIsRemoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name, config?.remote?.entry, config?.remote?.scope, config?.remote?.module]);

  if (isExtensionLoading) {
    return <div className="flex items-center gap-2 p-6 text-sm text-gray-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading extension…</div>;
  }

  if (isError || !extension) {
    return <div className="flex items-center gap-2 p-6 text-sm text-red-600"><AlertCircle className="h-4 w-4" /> Could not load extension details.</div>;
  }

  if (!extension.enabled) {
    return <div className="p-6 text-sm text-gray-500">This extension is disabled. Enable it from Settings → Extensions before opening its UI.</div>;
  }

  if (isRemoteLoading) {
    return <div className="flex items-center gap-2 p-6 text-sm text-gray-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading {config?.placement.label || extension.name} UI…</div>;
  }

  if (loadError || !RemoteComponent) {
    return (
      <div className="m-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <div className="mb-2 flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" /> Extension UI could not be loaded</div>
        <p>{loadError || "The remote module did not export a component."}</p>
      </div>
    );
  }

  return <div className="h-full overflow-auto"><RemoteComponent extensionName={extension.name} extension={extension} /></div>;
}
