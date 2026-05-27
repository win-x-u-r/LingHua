import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Chromium fires `beforeinstallprompt` once when the PWA is installable.
// We capture the event, hold onto it, and trigger it when the user clicks
// our custom install button.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "linghua-pwa-install-dismissed";

const isIOS = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPad on iPadOS 13+ identifies as Mac — check for touch as a tiebreaker.
  return /iPhone|iPad|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document);
};

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  // navigator.standalone is the legacy iOS Safari flag
  // matchMedia covers Chrome/Edge/Android
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

/**
 * Floating "Install app" button that appears at the bottom-right of the screen.
 *
 * - On Chromium browsers (Android Chrome, desktop Chrome/Edge), uses the native
 *   `beforeinstallprompt` event so the user sees the OS install dialog.
 * - On iOS Safari, shows manual instructions ("Tap the Share icon, then Add to
 *   Home Screen") because Apple does not expose a programmatic install API.
 * - Hides itself once the app is already installed (running in standalone mode)
 *   or after the user dismisses it (persisted via localStorage).
 */
const InstallPWA = () => {
  const { t } = useLanguage();
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Don't even render if already installed or user previously dismissed
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY) === "1") {
      setHidden(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setHidden(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installEvent) {
      installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted" || outcome === "dismissed") {
        setInstallEvent(null);
      }
      return;
    }
    if (isIOS()) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setHidden(true);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  if (hidden) return null;

  // Show the install button only when:
  //   - we have a captured beforeinstallprompt event (Chromium), OR
  //   - we're on iOS and the user can manually install
  const canShowButton = !!installEvent || isIOS();
  if (!canShowButton) return null;

  return (
    <>
      <div className="fixed bottom-4 end-4 z-50 flex items-center gap-2 rounded-full bg-gradient-coral text-white shadow-glow p-1 ps-3 animate-bounce-in">
        <Download className="w-4 h-4" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInstall}
          className="text-white hover:text-white hover:bg-white/20 h-8"
        >
          {t("pwa.install")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          aria-label={t("pwa.dismiss")}
          className="text-white hover:text-white hover:bg-white/20 w-7 h-7"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-glow p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2">{t("pwa.ios_title")}</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
              <li>{t("pwa.ios_step1")}</li>
              <li>{t("pwa.ios_step2")}</li>
              <li>{t("pwa.ios_step3")}</li>
            </ol>
            <Button
              className="w-full mt-4 bg-gradient-coral"
              onClick={() => setShowIOSGuide(false)}
            >
              {t("pwa.got_it")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPWA;
