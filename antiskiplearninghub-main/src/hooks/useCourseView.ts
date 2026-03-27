import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface LessonData {
  id: string;
  title: string;
  duration: string | null;
  videoUrl: string;
  orderIndex: number;
  completed: boolean;
  videoCompleted: boolean;
  quizPassed: boolean;
  quiz: { questions: QuizQuestion[]; passingScore: number } | null;
}

interface CourseViewData {
  courseTitle: string;
  courseDescription: string | null;
  lessons: LessonData[];
  loading: boolean;
  error: string | null;
}

export function useCourseView(courseId: string | undefined) {
  const { user } = useAuth();
  const [data, setData] = useState<CourseViewData>({
    courseTitle: "",
    courseDescription: null,
    lessons: [],
    loading: true,
    error: null,
  });

  const fetchCourseData = useCallback(async () => {
    if (!courseId || !user) return;

    try {
      // Fetch course, lessons, quizzes, and progress in parallel
      const [courseRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from("courses").select("title, description").eq("id", courseId).maybeSingle(),
        supabase.from("lessons").select("id, title, duration, video_url, order_index").eq("course_id", courseId).order("order_index"),
        supabase.from("lesson_progress").select("lesson_id, video_completed, quiz_passed, completed_at").eq("user_id", user.id),
      ]);

      if (courseRes.error) throw courseRes.error;
      if (lessonsRes.error) throw lessonsRes.error;
      if (!courseRes.data || !lessonsRes.data) {
        setData(prev => ({ ...prev, loading: false, error: "Course not found" }));
        return;
      }

      // Fetch quizzes for all lessons
      const lessonIds = lessonsRes.data.map(l => l.id);
      const quizzesRes = await supabase
        .from("quizzes")
        .select("lesson_id, questions, passing_score")
        .in("lesson_id", lessonIds);

      const quizMap = new Map<string, { questions: QuizQuestion[]; passingScore: number }>();
      if (quizzesRes.data) {
        for (const q of quizzesRes.data) {
          const questions = parseQuizQuestions(q.questions);
          quizMap.set(q.lesson_id, { questions, passingScore: q.passing_score ?? 70 });
        }
      }

      const progressMap = new Map<string, { videoCompleted: boolean; quizPassed: boolean; completedAt: string | null }>();
      if (progressRes.data) {
        for (const p of progressRes.data) {
          progressMap.set(p.lesson_id, {
            videoCompleted: p.video_completed ?? false,
            quizPassed: p.quiz_passed ?? false,
            completedAt: p.completed_at,
          });
        }
      }

      const lessons: LessonData[] = lessonsRes.data.map(l => {
        const prog = progressMap.get(l.id);
        return {
          id: l.id,
          title: l.title,
          duration: l.duration,
          videoUrl: l.video_url,
          orderIndex: l.order_index,
          completed: !!prog?.completedAt,
          videoCompleted: prog?.videoCompleted ?? false,
          quizPassed: prog?.quizPassed ?? false,
          quiz: quizMap.get(l.id) ?? null,
        };
      });

      setData({
        courseTitle: courseRes.data.title,
        courseDescription: courseRes.data.description,
        lessons,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [courseId, user]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const markVideoCompleted = useCallback(async (lessonId: string) => {
    if (!user) return;
    const { error } = await supabase.from("lesson_progress").upsert(
      { user_id: user.id, lesson_id: lessonId, video_completed: true, updated_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" }
    );
    if (!error) {
      setData(prev => ({
        ...prev,
        lessons: prev.lessons.map(l =>
          l.id === lessonId ? { ...l, videoCompleted: true } : l
        ),
      }));
    }
  }, [user]);

  const saveQuizScore = useCallback(async (lessonId: string, score: number, passed: boolean) => {
    if (!user) return;
    const updates: any = {
      user_id: user.id,
      lesson_id: lessonId,
      quiz_score: Math.round(score),
      quiz_passed: passed,
      updated_at: new Date().toISOString(),
    };
    if (passed) {
      updates.completed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("lesson_progress").upsert(
      updates,
      { onConflict: "user_id,lesson_id" }
    );
    if (!error) {
      setData(prev => ({
        ...prev,
        lessons: prev.lessons.map(l =>
          l.id === lessonId ? { ...l, quizPassed: passed, completed: passed ? true : l.completed } : l
        ),
      }));
    }
  }, [user]);

  return { ...data, markVideoCompleted, saveQuizScore, refetch: fetchCourseData };
}

function parseQuizQuestions(json: Json): QuizQuestion[] {
  if (!Array.isArray(json)) return [];
  return json.map((q: any, i: number) => ({
    id: q.id ?? `q${i}`,
    question: q.question ?? "",
    options: Array.isArray(q.options) ? q.options : [],
    correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
  }));
}
