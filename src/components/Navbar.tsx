import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Lantern from "@/components/lantern/Lantern";
import Seal from "@/components/Seal";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  // Each section is marked by a seal with a related character instead of an icon
  const navItems = [
    { path: "/", labelKey: "nav.home", seal: "家" },
    { path: "/translator", labelKey: "nav.translator", seal: "译" },
    { path: "/flashcards", labelKey: "nav.flashcards", seal: "卡" },
    { path: "/practice", labelKey: "nav.practice", seal: "说" },
    ...(user
      ? [
          { path: "/grammar", labelKey: "nav.grammar", seal: "文" },
          { path: "/dashboard", labelKey: "nav.dashboard", seal: "进" },
          { path: "/tutor", labelKey: "nav.tutor", seal: "师" },
        ]
      : []),
    { path: "/about", labelKey: "nav.about", seal: "关" },
  ];

  const initial = (profile?.full_name ?? user?.email ?? "?").trim().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-header text-header-foreground border-b-2 border-stroke">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Lantern still className="w-10 h-10" />
            <span className="text-xl font-bold">Líng Huà</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 h-10 px-2.5 rounded-[10px] border-2 font-semibold ${
                    active
                      ? "border-stroke bg-sunshine text-sunshine-foreground shadow-stamp-sm"
                      : "border-transparent hover:bg-header-hover"
                  }`}
                >
                  <Seal char={item.seal} size="sm" tone={active ? "red" : "ink"} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              title={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
              aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              {language === "ar" ? "EN" : "ع"}
            </Button>
            <ThemeToggle />

            {user ? (
              <>
                <Link to="/profile" aria-label={t("nav.profile")} title={t("nav.profile")}>
                  <span className="grid place-items-center w-10 h-10 rounded-full border-2 border-stroke bg-secondary text-secondary-foreground font-bold">
                    {initial}
                  </span>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-header-hover">
                  {t("nav.signout")}
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" variant="secondary">{t("nav.signin")}</Button>
              </Link>
            )}
          </div>

          {/* Mobile and tablet: the menu button opens a drawer that holds everything */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={t("nav.menu")}
              aria-expanded={mobileOpen}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                {mobileOpen ? (
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                ) : (
                  <path d="M4 7 H20 M4 12 H20 M4 17 H20" />
                )}
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t-2 border-stroke bg-card text-foreground">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 h-12 px-2 rounded-[10px] border-2 font-semibold text-lg ${
                    active ? "border-stroke bg-sunshine text-sunshine-foreground" : "border-transparent"
                  }`}
                >
                  <Seal char={item.seal} size="sm" tone={active ? "red" : "ink"} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}

            <div className="flex items-center gap-2 pt-3 mt-2 border-t-2 border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              >
                {t("nav.language")}
              </Button>

              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <span className="truncate">{profile?.full_name ?? t("nav.profile")}</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={handleSignOut}>
                    {t("nav.signout")}
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button className="w-full">{t("nav.signin")}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
