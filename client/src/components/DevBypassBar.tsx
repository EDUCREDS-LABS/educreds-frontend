import { DEV_BYPASS_AUTH, ensureDevBypassSession, getDevBypassRole, type DevBypassRole } from "@/lib/devBypass";

const ROLE_LINKS: Array<{ role: DevBypassRole; label: string; href: string }> = [
  { role: "institution", label: "Institution",  href: "/?as=institution" },
  { role: "student",     label: "Student",      href: "/student/login?as=student" },
  { role: "verifier",    label: "Verifier",     href: "/verifier/verify?as=verifier" },
  { role: "government",  label: "Government",   href: "/government/dashboard?as=government" },
  { role: "developer",   label: "Developer",    href: "/developer-portal?as=developer" },
];

const PAGE_LINKS = [
  { href: "/verify",                     label: "Public verify" },
  { href: "/access",                     label: "Portal" },
  { href: "/institution/dashboard",      label: "Inst. dashboard" },
  { href: "/government/dashboard",       label: "Gov. dashboard" },
  { href: "/verifier/verify",            label: "Verifier verify" },
  { href: "/developer-portal",           label: "Dev portal" },
  { href: "/student/login",             label: "Student portal" },
];

export function DevBypassBar() {
  if (!DEV_BYPASS_AUTH) return null;
  const role = getDevBypassRole();

  return (
    <div className="fixed top-0 inset-x-0 z-[200] bg-amber-400 text-neutral-900 text-[11px] font-bold tracking-wide shadow-md">
      <div className="max-w-7xl mx-auto px-3 py-1.5 flex flex-wrap items-center gap-2 justify-between">
        <span className="uppercase tracking-[0.14em]">Dev bypass · role: {role}</span>
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-neutral-600 mr-1">Switch:</span>
          {ROLE_LINKS.map((r) => (
            <a key={r.role} href={r.href}
              onClick={() => ensureDevBypassSession(r.role)}
              className={`px-2 py-0.5 rounded-md ${role === r.role ? "bg-neutral-900 text-amber-300" : "bg-white/70 hover:bg-white"}`}>
              {r.label}
            </a>
          ))}
          <span className="text-neutral-600 mx-1">|</span>
          {PAGE_LINKS.map((link) => (
            <a key={link.href} href={link.href}
              className="px-2 py-0.5 rounded-md bg-neutral-900/20 hover:bg-neutral-900/30">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
