"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  showWorks: boolean;
  showComments: boolean;
};

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Header({
  showWorks,
  showComments,
}: Props) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Home",
      visible: true,
    },
    {
      href: "/works",
      label: "Works",
      visible: showWorks,
    },
    {
      href: "/comments",
      label: "Comments",
      visible: showComments,
    },
    {
      href: "/guide",
      label: "Guide",
      visible: true,
    },
    {
      href: "/faq",
      label: "FAQ",
      visible: true,
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => item.visible
  );

  return (
    <header className="site-header">
      <Link
        className="site-logo"
        href="/"
        aria-label="トップページへ"
      >
        <img
          src={`${basePath}/logo.png`}
          alt="弾き語り曲投稿祭"
        />

        <span>
          <strong>
            弾き語り曲投稿祭
          </strong>

          <small>2027</small>
        </span>
      </Link>

      <nav
        className="site-nav"
        aria-label="メインナビゲーション"
      >
        {visibleNavItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" ||
                pathname === basePath
              : pathname === item.href ||
                pathname?.startsWith(
                  `${item.href}/`
                ) ||
                pathname ===
                  `${basePath}${item.href}` ||
                pathname?.startsWith(
                  `${basePath}${item.href}/`
                );

          return (
            <Link
              className={
                active
                  ? "site-nav__link is-active"
                  : "site-nav__link"
              }
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