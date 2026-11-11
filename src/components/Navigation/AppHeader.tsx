import { NavLink } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useMemo } from "react";

import SignOutButton from "../Auth/SignOutButton";
import logo from "../../assets/sealman_logo.png";
import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";

// Docs and Help are placeholders until the targets exist.
const HEADER_LINKS = [
  { label: "Docs", href: "#" },
  { label: "Help", href: "#" },
];

export default function AppHeader() {
  const auth = useAuth();

  const initials = useMemo(() => {
    return auth.user?.name?.split(" ").map((n) => n[0]).join("") || "";
  }, [auth.user?.name]);

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-blue-100 bg-linear-to-r from-white via-blue-50/60 to-blue-100/70 px-4 shadow-sm">
      <div className="flex items-center gap-6">
        <img className="h-10 w-auto max-w-full object-contain" src="data:image/png;base64,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" alt="GEA"></img>
        <img className="h-10 w-auto max-w-full object-contain" src={logo} alt="Sealman IoT" />
      </div>

      <div className="flex items-center gap-1">
        {HEADER_LINKS.map((link) => (
          <Button key={link.label} asChild variant="ghost" size="sm" className="text-gray-700">
            <a href={link.href} onClick={(e) => e.preventDefault()}>
              {link.label}
            </a>
          </Button>
        ))}

        <Menu as="div" className="relative ml-2">
          <MenuButton className="flex items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-white/70 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-vibrant-blue">
            <span className="sr-only">Open user menu</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-medium text-gray-700">
              {initials}
            </span>
            <span className="hidden max-w-48 truncate text-sm font-medium text-gray-700 sm:block">
              {auth.user?.name}
            </span>
            <ChevronDownIcon className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block" aria-hidden="true" />
          </MenuButton>
          <MenuItems
            anchor="bottom end"
            className="z-50 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 [--anchor-gap:0.5rem] focus:outline-hidden"
          >
            <MenuItem>
              {({ close }) => (
                <NavLink
                  to="/user/profile"
                  onClick={close}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  User Profile
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              <SignOutButton />
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </header>
  );
}
