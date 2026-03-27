import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StickyNote, Save, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LessonNotesProps {
  lessonId: string;
  lessonTitle: string;
}

const LessonNotes = ({ lessonId, lessonTitle }: LessonNotesProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch existing note
  useEffect(() => {
    if (!user || !lessonId) return;
    setLoading(true);
    supabase
      .from("lesson_notes")
      .select("content")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .maybeSingle()
      .then(({ data }) => {
        const c = data?.content ?? "";
        setContent(c);
        setSavedContent(c);
        setLoading(false);
      });
  }, [user, lessonId]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !lessonId) return;
    const channel = supabase
      .channel(`notes-${lessonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lesson_notes",
          filter: `lesson_id=eq.${lessonId}`,
        },
        (payload: any) => {
          if (payload.new?.user_id === user.id) {
            setSavedContent(payload.new.content);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, lessonId]);

  const saveNote = useCallback(async (text: string) => {
    if (!user) return;
    setSaving(true);
    await supabase.from("lesson_notes").upsert(
      { user_id: user.id, lesson_id: lessonId, content: text },
      { onConflict: "user_id,lesson_id" }
    );
    setSavedContent(text);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [user, lessonId]);

  // Auto-save with debounce
  const handleChange = (val: string) => {
    setContent(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote(val), 1200);
  };

  const hasUnsaved = content !== savedContent;

  if (loading) {
    return (
      <div className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading notes…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Notes — {lessonTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-success flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Saved
              </motion.span>
            )}
          </AnimatePresence>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => saveNote(content)}
            disabled={saving || !hasUnsaved}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </Button>
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Take notes while watching the lesson…"
        className="min-h-[160px] resize-y text-sm bg-background border-border/50 focus:border-primary/50"
      />
      {hasUnsaved && !saving && (
        <p className="text-xs text-muted-foreground">Unsaved changes — auto-saves in a moment</p>
      )}
    </div>
  );
};

export default LessonNotes;
