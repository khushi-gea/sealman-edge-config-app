import { NavLink, Outlet } from "react-router-dom";
import { useListExtensions } from "@/generated/edge-administration/hooks/useExtensions";
import { useExtensionUiRegistry } from "@/features/Extensions/extensionUi";

type SettingsTab = {
  label: string;
  path: string;
};

const SETTINGS_TABS: SettingsTab[] = [
  { label: "Platform Types", path: "platform-types" },
  { label: "Templates", path: "templates" },
  { label: "Extensions", path: "extensions" },
];

export default function SettingsLayout() {
  const { data: extensions } = useListExtensions();
  const extensionUiRegistry = useExtensionUiRegistry();

  const extensionTabs = (extensions ?? []).filter((extension) => {
    const ui = extensionUiRegistry[extension.name];
    return extension.enabled && ui?.placement.slot === "settings-nav";
  });

  return (
    <div className="h-full flex bg-gray-50">
      <div className="w-64 bg-white border-r">
        <div className="p-4 font-semibold text-lg border-b">Settings</div>
        <nav className="flex flex-col p-2 gap-1">
          {SETTINGS_TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}

          {extensionTabs.map((extension) => (
            <NavLink
              key={`extension-${extension.name}`}
              to={`extension-ui/${encodeURIComponent(extension.name)}`}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"
                }`
              }
            >
              {extensionUiRegistry[extension.name]?.placement.label || extension.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
