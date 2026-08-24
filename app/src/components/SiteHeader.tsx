import { Link } from "react-router";
import { profile } from "../data/profile";

const navItems = [
  { to: "/#hardware", label: "Hardware" },
  { to: "/#software", label: "Software" },
  { to: "/#contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-base/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="flex min-h-12 items-center rounded-md px-2 font-mono text-sm font-semibold"
        >
          {profile.name}
        </Link>
        <nav className="flex items-center font-mono text-xs text-muted">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-h-12 items-center rounded-md px-2 transition-colors hover:text-ink sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
