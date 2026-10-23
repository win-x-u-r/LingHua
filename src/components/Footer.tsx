import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto w-full border-t-2 border-stroke bg-card">
      <div className="container mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="font-bold text-foreground">
          Líng Huà <span lang="zh" className="text-primary">灵话</span>
        </span>
        <span>© 2026 · {t("footer.tagline")}</span>
      </div>
    </footer>
  );
};

export default Footer;
