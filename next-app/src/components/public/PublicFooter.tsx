const logoLight =
  "https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media&token=627ec9de-a950-41f7-9138-dd7a33518c55";

const footerLinks = [
  { href: "/", label: "Features" },
  { href: "/community", label: "Community" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Support" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/policy#bio-link", label: "Policy" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoLight} alt="CareerVivid Logo" className="h-8 w-auto" />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-gray-500 dark:text-gray-400">
            {footerLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-[#625bd5]">
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 CareerVivid. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
