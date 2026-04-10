import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, PenTool } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import HanziWriter from "hanzi-writer";

interface StrokeOrderProps {
  character: string;
}

const StrokeOrder = ({ character }: StrokeOrderProps) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [strokeCount, setStrokeCount] = useState<number | null>(null);
  const [mode, setMode] = useState<"idle" | "animating" | "quiz">("idle");

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous writer instance
    containerRef.current.innerHTML = "";
    writerRef.current = null;
    setStrokeCount(null);
    setMode("idle");

    try {
      const writer = HanziWriter.create(containerRef.current, character, {
        width: 200,
        height: 200,
        padding: 5,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 200,
        showOutline: true,
        showCharacter: false,
      });

      writerRef.current = writer;

      // Get stroke count from the character data
      HanziWriter.loadCharacterData(character).then((data) => {
        if (data) {
          setStrokeCount(data.strokes.length);
        }
      });
    } catch (err) {
      console.error("Failed to create HanziWriter for:", character, err);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      writerRef.current = null;
    };
  }, [character]);

  const handleAnimate = useCallback(() => {
    if (!writerRef.current) return;
    setMode("animating");
    writerRef.current.animateCharacter({
      onComplete: () => setMode("idle"),
    });
  }, []);

  const handleQuiz = useCallback(() => {
    if (!writerRef.current) return;
    setMode("quiz");
    writerRef.current.quiz({
      onComplete: () => setMode("idle"),
    });
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className="border border-border rounded-lg bg-background"
        style={{ width: 200, height: 200 }}
      />
      {strokeCount !== null && (
        <span className="text-xs text-muted-foreground">
          {t("flashcards.strokes")}: {strokeCount}
        </span>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAnimate}
          disabled={mode === "animating"}
        >
          <Play className="w-3 h-3 mr-1" />
          {t("flashcards.play")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleQuiz}
          disabled={mode === "quiz"}
        >
          <PenTool className="w-3 h-3 mr-1" />
          {t("flashcards.practice")}
        </Button>
      </div>
    </div>
  );
};

export default StrokeOrder;
