import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Enrollment {
  id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
}

export function useEnrollment(courseId?: string) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchEnrollments();
  }, [courseId]);

  const fetchEnrollments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      setEnrollments(data || []);
      
      if (courseId) {
        setIsEnrolled(data?.some((e) => e.course_id === courseId) || false);
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const enroll = async (courseIdToEnroll: string) => {
    setEnrolling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to enroll in courses");
        return false;
      }

      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          user_id: user.id,
          course_id: courseIdToEnroll,
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already enrolled in this course");
          return true;
        }
        throw error;
      }

      toast.success("Successfully enrolled in course!");
      await fetchEnrollments();
      return true;
    } catch (error) {
      console.error("Error enrolling:", error);
      toast.error("Failed to enroll in course");
      return false;
    } finally {
      setEnrolling(false);
    }
  };

  const unenroll = async (courseIdToUnenroll: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from("course_enrollments")
        .delete()
        .eq("user_id", user.id)
        .eq("course_id", courseIdToUnenroll);

      if (error) throw error;

      toast.success("Unenrolled from course");
      await fetchEnrollments();
      return true;
    } catch (error) {
      console.error("Error unenrolling:", error);
      toast.error("Failed to unenroll from course");
      return false;
    }
  };

  return {
    enrollments,
    isEnrolled,
    loading,
    enrolling,
    enroll,
    unenroll,
    refetch: fetchEnrollments,
  };
}
