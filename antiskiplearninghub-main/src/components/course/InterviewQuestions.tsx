import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BrainCircuit, RefreshCw, Sparkles } from "lucide-react";

interface InterviewQuestion {
  question: string;
  answer: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

interface InterviewQuestionsProps {
  courseTitle: string;
  lessonTitle: string;
}

const difficultyColor: Record<string, string> = {
  Easy: "bg-success/15 text-success",
  Medium: "bg-warning/15 text-warning",
  Hard: "bg-destructive/15 text-destructive",
};

const InterviewQuestions = ({ courseTitle, lessonTitle }: InterviewQuestionsProps) => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("generate-interview-questions", {
        body: { courseTitle, lessonTitle },
      });

      if (res.error) throw res.error;

      const data = res.data;
      if (data?.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions as InterviewQuestion[]);
        setGenerated(true);
      } else {
        console.error("Unexpected response format:", data);
      }
    } catch (err) {
      console.error("Failed to generate interview questions:", err);
    } finally {
      setLoading(false);
    }
  }, [courseTitle, lessonTitle]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Interview Questions</h3>
        </div>
        {generated && (
          <Button variant="ghost" size="sm" onClick={generateQuestions} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {!generated && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
        >
          <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Get AI-generated interview questions based on this lesson's topic
          </p>
          <Button variant="secondary" onClick={generateQuestions}>
            <BrainCircuit className="w-4 h-4" />
            Generate Questions
          </Button>
        </motion.div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {generated && !loading && questions.length > 0 && (
        <ScrollArea className="max-h-[400px]">
          <Accordion type="multiple" className="space-y-2">
            <AnimatePresence>
              {questions.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <AccordionItem
                    value={`q-${i}`}
                    className="border border-border/50 rounded-lg px-4 data-[state=open]:bg-muted/30"
                  >
                    <AccordionTrigger className="text-sm text-left hover:no-underline gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                            difficultyColor[q.difficulty] || ""
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <span>{q.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pt-1 pb-3 pl-[52px]">
                      {q.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </Accordion>
        </ScrollArea>
      )}
    </div>
  );
};

export default InterviewQuestions;
