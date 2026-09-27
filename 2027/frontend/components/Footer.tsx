
import { siteLinks } from "@/lib/siteLinks";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>弾き語り曲投稿祭 2027</strong>
        <p>Hikigatari Song Festival</p>
      </div>
      <div className="site-footer__links">
        <span>主催：D-Neb（GAKKI）</span>
        {siteLinks.contactX && (
          <a
            href={siteLinks.contactX}
            target="_blank"
            rel="noopener noreferrer"
          >
            X / Contact
          </a>
        )}
      </div>
    </footer>
  );
}
