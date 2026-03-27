 import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
 import { ChevronRight, BookOpen } from "lucide-react";
 import { useAuth } from "@/hooks/useAuth";
 import { useDashboard } from "@/hooks/useDashboard";
 import StatsGrid from "@/components/dashboard/StatsGrid";
 import CourseCard from "@/components/dashboard/CourseCard";
 import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
   const { user, loading: authLoading } = useAuth();
   const { courses, stats, loading: dashboardLoading } = useDashboard();

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Learner";
   const loading = authLoading || dashboardLoading;

  if (loading) {
    return (
       <div className="min-h-screen bg-background">
         <Navbar />
         <main className="pt-24 pb-12 px-4">
           <div className="container mx-auto max-w-6xl">
             <Skeleton className="h-10 w-64 mb-2" />
             <Skeleton className="h-5 w-96 mb-8" />
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
               {[1, 2, 3, 4].map((i) => (
                 <Skeleton key={i} className="h-32 rounded-xl" />
               ))}
             </div>
             <Skeleton className="h-6 w-48 mb-4" />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1, 2, 3].map((i) => (
                 <Skeleton key={i} className="h-72 rounded-xl" />
               ))}
             </div>
           </div>
         </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated userName={userName} />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-display font-bold mb-2">
              Welcome back, <span className="text-primary">{userName}</span>!
            </h1>
            <p className="text-muted-foreground">
              Continue your learning journey. You're doing great!
            </p>
          </motion.div>

          {/* Stats Grid */}
           <StatsGrid
             coursesEnrolled={stats.coursesEnrolled}
             hoursLearned={stats.hoursLearned}
             quizzesPassed={stats.quizzesPassed}
             completionRate={stats.completionRate}
           />

          {/* Continue Learning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Continue Learning</h2>
              <Link
                to="/courses"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All Courses
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

             {courses.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {courses.map((course, index) => (
                   <CourseCard
                     key={course.id}
                     id={course.id}
                     title={course.title}
                     description={course.description}
                     thumbnail_url={course.thumbnail_url}
                     duration_minutes={course.duration_minutes}
                     progress={course.progress}
                     completedLessons={course.completedLessons}
                     totalLessons={course.totalLessons}
                     index={index}
                   />
                 ))}
               </div>
             ) : (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: 0.2 }}
                 className="text-center py-12 rounded-xl bg-card border border-border/50"
               >
                 <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                 <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                 <p className="text-muted-foreground mb-4">
                   Start your learning journey by enrolling in a course
                 </p>
                 <Button asChild>
                   <Link to="/courses">Browse Courses</Link>
                 </Button>
               </motion.div>
             )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 rounded-xl bg-gradient-primary text-primary-foreground"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">Ready to learn more?</h3>
                <p className="text-primary-foreground/80">
                  Explore our full catalog of focus-first courses
                </p>
              </div>
              <Button variant="heroOutline" size="lg" asChild className="border-white/30 text-white hover:bg-white/10">
                <Link to="/courses">
                  Browse Courses
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
