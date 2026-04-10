import footerBg from "@/assets/footer-bg.png";

const Footer = () => {
  return (
    <footer className="mt-auto w-full relative h-[150px]">
      {/* Background image layer */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${footerBg})`, backgroundPosition: 'center 80%' }}
      />
      {/* Content */}
      <div className="relative h-full pb-3 flex items-center justify-center">
        <div className="text-sm font-mono text-zinc-950/60 font-medium">
          © 2026 Ling Hua - Your Mandarin Learning Companion
        </div>
      
      </div>
    </footer>
  );
};

export default Footer;
