"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/works", label: "Works" },
  { href: "/comments", label: "Comments" },
  { href: "/guide", label: "Guide" },
  { href: "/faq", label: "FAQ" },
];

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link className="site-logo" href="/" aria-label="トップページへ">
        <img
          src={`${basePath}/logo-placeholder.svg`}
          alt="弾き語り曲投稿祭"
        />
        <span>
          <strong>弾き語り曲投稿祭</strong>
          <small>2027</small>
        </span>
      </Link>

      <nav className="site-nav" aria-label="メインナビゲーション">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || pathname === basePath
              : pathname?.includes(item.href);

          return (
            <Link
              className={active ? "site-nav__link is-active" : "site-nav__link"}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
