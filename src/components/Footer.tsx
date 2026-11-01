import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto w-full border-t-2 border-stroke bg-footer text-footer-foreground">
      <div className="container mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-2 text-sm text-footer-muted">
        <span className="font-bold">
          LingHua <span lang="zh" className="font-zh text-sunshine">灵话</span>
        </span>
        <span>{t("footer.tagline")} © 2026</span>
      </div>
    </footer>
  );
};

export default Footer;
