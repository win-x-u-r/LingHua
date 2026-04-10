import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMicrophone } from "@/hooks/use-microphone";
import { pronounceAndScore } from "@/lib/linghuaAPI";
import { useLanguage } from "@/contexts/LanguageContext";

const Practice = () => {
  const [expectedText, setExpectedText] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const [expectedPinyin, setExpectedPinyin] = useState("");
  const [expectedArabic, setExpectedArabic] = useState("");
  const [recognizedPinyin, setRecognizedPinyin] = useState("");
  const [recognizedArabic, setRecognizedArabic] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<{ character: number; pinyin: number; tone: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isRecording, startRecording, stopRecording, audioBlob, error: micError } = useMicrophone();

  // Handle mic errors
  useEffect(() => {
    if (micError) {
      toast({ title: t("common.mic_error"), description: micError, variant: "destructive" });
    }
  }, [micError, toast]);

  // Process recorded audio when blob is ready
  useEffect(() => {
    if (!audioBlob || !expectedText.trim()) return;

    const processAudio = async () => {
      setIsProcessing(true);
      try {
        const file = new File([audioBlob], "recording.webm", { type: audioBlob.type });
        const result = await pronounceAndScore(file, expectedText);
        setRecognizedText(result.recognized);
        setScore(result.score);
        setExpectedPinyin(result.expected_pinyin || "");
        setExpectedArabic(result.expected_arabic || "");
        setRecognizedPinyin(result.recognized_pinyin || "");
        setRecognizedArabic(result.recognized_arabic || "");
        setScoreBreakdown({
          character: result.breakdown.character.score,
          pinyin: result.breakdown.pinyin.score,
          tone: result.breakdown.tone.score,
        });

        const { breakdown } = result;
        const details = `Characters: ${breakdown.character.score}% | Pinyin: ${breakdown.pinyin.score}% | Tones: ${breakdown.tone.score}%`;
        toast({
          title: `Score: ${result.score}/100`,
          description: details,
        });
      } catch {
        toast({
          title: "Processing Failed",
          description: "Please make sure the backend is running on localhost:5000",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processAudio();
  }, [audioBlob]);

  const handleMicToggle = async () => {
    if (!expectedText.trim()) {
      toast({
        title: t("practice.enter_expected"),
        description: t("practice.enter_expected_desc"),
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      setRecognizedText("");
      setScore(null);
      await startRecording();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreFeedback = (score: number) => {
    if (score >= 85) return t("practice.great");
    if (score >= 60) return t("practice.almost");
    return t("practice.try_again");
  };

  const getScoreProgress = (score: number) => {
    if (score >= 85) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-coral bg-clip-text text-transparent">
            {t("practice.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("practice.subtitle")}
          </p>
        </div>

        {/* Main Practice Card */}
        <Card className="p-8 bg-gradient-to-br from-card to-muted/20 shadow-glow border-2 border-primary/10">
          <div className="space-y-6">
            {/* Expected Text Input */}
            <div>
              <Label htmlFor="expected" className="text-lg font-semibold mb-2 block">
                {t("practice.expected_label")}
              </Label>
              <Input
                id="expected"
                placeholder={t("practice.expected_placeholder")}
                value={expectedText}
                onChange={(e) => setExpectedText(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {t("practice.example")}
              </p>
            </div>

            {/* Mic Recording Button */}
            <div>
              <Label className="text-lg font-semibold mb-2 block">
                {t("practice.record_label")}
              </Label>
              <Button
                onClick={handleMicToggle}
                disabled={!expectedText.trim() || isProcessing}
                className={`w-full transition-transform ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-gradient-lavender hover:scale-105"
                }`}
                size="lg"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5 mr-2" />
                    {t("practice.stop_recording")}
                  </>
                ) : isProcessing ? (
                  t("practice.processing")
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    {t("practice.start_recording")}
                  </>
                )}
              </Button>
              {isRecording && (
                <div className="flex items-center justify-center gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-500 rounded-full animate-pulse"
                      style={{
                        height: `${12 + Math.random() * 20}px`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                  <span className="ml-2 text-sm text-red-500 font-medium">{t("common.recording")}</span>
                </div>
              )}
            </div>

            {/* Results */}
            {recognizedText && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border-2 border-primary/20 animate-bounce-in">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  {t("practice.results")}
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("practice.expected")}</p>
                    <p className="text-lg font-medium">{expectedText}</p>
                    {expectedPinyin && (
                      <p className="text-sm text-primary font-medium">{expectedPinyin}</p>
                    )}
                    {expectedArabic && (
                      <p className="text-sm text-muted-foreground font-medium" dir="rtl">{expectedArabic}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">{t("practice.you_said")}</p>
                    <p className="text-lg font-medium">{recognizedText}</p>
                    {recognizedPinyin && (
                      <p className="text-sm text-secondary-foreground font-medium">{recognizedPinyin}</p>
                    )}
                    {recognizedArabic && (
                      <p className="text-sm text-muted-foreground font-medium" dir="rtl">{recognizedArabic}</p>
                    )}
                  </div>

                  {score !== null && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">{t("practice.accuracy")}</p>

                      {/* Animated score bar */}
                      <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${getScoreProgress(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>

                      <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                        {score}/100
                      </div>
                      <p className="text-lg mt-2">{getScoreFeedback(score)}</p>

                      {/* Detailed breakdown */}
                      {scoreBreakdown && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">{t("practice.characters")}</p>
                            <p className="text-lg font-bold">{scoreBreakdown.character}%</p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">{t("practice.pinyin")}</p>
                            <p className="text-lg font-bold">{scoreBreakdown.pinyin}%</p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">{t("practice.tones")}</p>
                            <p className="text-lg font-bold">{scoreBreakdown.tone}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6 p-6 bg-muted/30">
          <h3 className="font-bold mb-4 text-lg">{t("practice.tips_title")}</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{t("practice.tip1")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{t("practice.tip2")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{t("practice.tip3")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{t("practice.tip4")}</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Practice;
