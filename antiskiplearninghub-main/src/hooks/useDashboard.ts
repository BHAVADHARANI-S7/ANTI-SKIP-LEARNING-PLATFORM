 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 interface CourseWithProgress {
   id: string;
   title: string;
   description: string | null;
   thumbnail_url: string | null;
   duration_minutes: number | null;
   lessons_count: number | null;
   progress: number;
   completedLessons: number;
   totalLessons: number;
 }
 
 interface DashboardStats {
   coursesEnrolled: number;
   hoursLearned: number;
   quizzesPassed: number;
   completionRate: number;
 }
 
 export function useDashboard() {
   const [courses, setCourses] = useState<CourseWithProgress[]>([]);
   const [stats, setStats] = useState<DashboardStats>({
     coursesEnrolled: 0,
     hoursLearned: 0,
     quizzesPassed: 0,
     completionRate: 0,
   });
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     fetchDashboardData();
   }, []);
 
   const fetchDashboardData = async () => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         setLoading(false);
         return;
       }
 
       // Fetch enrollments
       const { data: enrollments, error: enrollError } = await supabase
         .from("course_enrollments")
         .select("course_id")
         .eq("user_id", user.id);
 
       if (enrollError) throw enrollError;
 
       if (!enrollments || enrollments.length === 0) {
         setLoading(false);
         return;
       }
 
       const courseIds = enrollments.map((e) => e.course_id);
 
       // Fetch courses
       const { data: coursesData, error: coursesError } = await supabase
         .from("courses")
         .select("*")
         .in("id", courseIds);
 
       if (coursesError) throw coursesError;
 
       // Fetch lessons for enrolled courses
       const { data: lessons, error: lessonsError } = await supabase
         .from("lessons")
         .select("id, course_id")
         .in("course_id", courseIds);
 
       if (lessonsError) throw lessonsError;
 
       // Fetch user's lesson progress
       const { data: progress, error: progressError } = await supabase
         .from("lesson_progress")
         .select("*")
         .eq("user_id", user.id);
 
       if (progressError) throw progressError;
 
       // Calculate progress per course
       const coursesWithProgress: CourseWithProgress[] = (coursesData || []).map((course) => {
         const courseLessons = lessons?.filter((l) => l.course_id === course.id) || [];
         const lessonIds = courseLessons.map((l) => l.id);
         const completedLessons = progress?.filter(
           (p) => lessonIds.includes(p.lesson_id) && p.completed_at
         ).length || 0;
         const totalLessons = courseLessons.length || course.lessons_count || 0;
         const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
 
         return {
           id: course.id,
           title: course.title,
           description: course.description,
           thumbnail_url: course.thumbnail_url,
           duration_minutes: course.duration_minutes,
           lessons_count: course.lessons_count,
           progress: progressPercent,
           completedLessons,
           totalLessons,
         };
       });
 
       setCourses(coursesWithProgress);
 
       // Calculate stats
       const totalCompleted = progress?.filter((p) => p.completed_at).length || 0;
       const totalLessonsAll = lessons?.length || 0;
       const quizzesPassed = progress?.filter((p) => p.quiz_passed).length || 0;
       const hoursLearned = (coursesData || []).reduce((acc, c) => {
         const courseProgress = coursesWithProgress.find((cp) => cp.id === c.id);
         if (courseProgress && c.duration_minutes) {
           return acc + (c.duration_minutes * courseProgress.progress) / 100;
         }
         return acc;
       }, 0) / 60;
 
       setStats({
         coursesEnrolled: enrollments.length,
         hoursLearned: Math.round(hoursLearned * 10) / 10,
         quizzesPassed,
         completionRate: totalLessonsAll > 0 ? Math.round((totalCompleted / totalLessonsAll) * 100) : 0,
       });
     } catch (error) {
       console.error("Error fetching dashboard data:", error);
     } finally {
       setLoading(false);
     }
   };
 
   return { courses, stats, loading, refetch: fetchDashboardData };
 }