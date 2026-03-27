import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Award, RotateCcw, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizProps {
  questions: Question[];
  onComplete: (passed: boolean, score?: number) => void;
  passed: boolean;
  voiceSelectedOption?: number | null;
  voiceTriggerSubmit?: number;
}

const Quiz = ({ questions, onComplete, passed, voiceSelectedOption, voiceTriggerSubmit }: QuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Voice control: select option
  useEffect(() => {
    if (voiceSelectedOption !== null && voiceSelectedOption !== undefined && !showResults) {
      const q = questions[currentQuestion];
      if (q && voiceSelectedOption < q.options.length) {
        handleSelectAnswer(voiceSelectedOption);
      }
    }
  }, [voiceSelectedOption]);

  // Voice control: submit/next
  const prevSubmitRef = useRef(voiceTriggerSubmit);
  useEffect(() => {
    if (voiceTriggerSubmit && voiceTriggerSubmit !== prevSubmitRef.current) {
      prevSubmitRef.current = voiceTriggerSubmit;
      if (selectedAnswers[currentQuestion] !== undefined && !showResults) {
        handleNext();
      }
    }
  }, [voiceTriggerSubmit]);
  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    const percentage = (correct / questions.length) * 100;
    setScore(percentage);
    setShowResults(true);
    const isPassed = percentage >= 70;
    onComplete(isPassed, percentage);

    if (isPassed) {
      // Fire confetti celebration
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96E6A1", "#DDA0DD"];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setScore(0);
  };

  if (showResults) {
    const isPassed = score >= 70;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 rounded-xl bg-card border border-border text-center"
      >
        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center relative ${isPassed ? "bg-success/10" : "bg-destructive/10"}`}>
          {isPassed ? (
            <>
              <Award className="w-10 h-10 text-success" />
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1" />
              </motion.div>
            </>
          ) : (
            <XCircle className="w-10 h-10 text-destructive" />
          )}
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">
          {isPassed ? "🎉 Congratulations!" : "Keep Learning!"}
        </h2>
        <p className="text-muted-foreground mb-4">
          You scored {Math.round(score)}% ({isPassed ? "Passed" : "70% required to pass"})
        </p>
        {isPassed && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-success font-medium mb-4"
          >
            ✨ Amazing work! You've mastered this lesson!
          </motion.p>
        )}
        {!isPassed && (
          <Button onClick={handleRetry} variant="hero">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </motion.div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i <= currentQuestion ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-6">{question.question}</h3>

      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(index)}
            className={`w-full p-4 rounded-lg text-left transition-all border ${
              selectedAnswers[currentQuestion] === index
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
          </button>
        ))}
      </div>

      <Button
        onClick={handleNext}
        variant="hero"
        className="w-full"
        disabled={selectedAnswers[currentQuestion] === undefined}
      >
        {currentQuestion < questions.length - 1 ? "Next Question" : "Submit Quiz"}
      </Button>
    </div>
  );
};

export default Quiz;
