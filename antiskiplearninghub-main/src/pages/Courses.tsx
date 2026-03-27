 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { motion } from "framer-motion";
 import Navbar from "@/components/layout/Navbar";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { useAuth } from "@/hooks/useAuth";
 import { useEnrollment } from "@/hooks/useEnrollment";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import {
   Clock,
   Play,
   Search,
   BookOpen,
   Users,
   Star,
   Loader2,
   CheckCircle,
 } from "lucide-react";
 
 interface Course {
   id: string;
   title: string;
   description: string | null;
   thumbnail_url: string | null;
   duration_minutes: number | null;
   lessons_count: number | null;
 }
 
 const courseCategories: Record<string, string> = {
   "00000000-0000-0000-0000-000000000001": "Web Development",
   "00000000-0000-0000-0000-000000000002": "Web Development",
   "00000000-0000-0000-0000-000000000003": "Databases",
   "00000000-0000-0000-0000-000000000004": "Programming",
   "00000000-0000-0000-0000-000000000005": "Design",
   "00000000-0000-0000-0000-000000000006": "AI & ML",
 };

const categories = ["All", "Web Development", "Programming", "Databases", "Design", "AI & ML"];

const Courses = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { enrollments, enrolling, enroll, loading: enrollmentLoading } = useEnrollment();
   const [courses, setCourses] = useState<Course[]>([]);
   const [loadingCourses, setLoadingCourses] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

   useEffect(() => {
     fetchCourses();
   }, []);
 
   const fetchCourses = async () => {
     try {
       const { data, error } = await supabase
         .from("courses")
         .select("*")
         .order("created_at", { ascending: true });
 
       if (error) throw error;
       setCourses(data || []);
     } catch (error) {
       console.error("Error fetching courses:", error);
       toast.error("Failed to load courses");
     } finally {
       setLoadingCourses(false);
     }
   };
 
   const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
     const category = courseCategories[course.id] || "Programming";
     const matchesCategory = selectedCategory === "All" || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isEnrolledInCourse = (courseId: string) => {
    return enrollments.some((e) => e.course_id === courseId);
  };

  const handleEnroll = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to enroll in courses");
      navigate("/login");
      return;
    }

    setEnrollingCourseId(courseId);
    const success = await enroll(courseId);
    if (success) {
      navigate(`/course/${courseId}`);
    }
    setEnrollingCourseId(null);
  };

  const handleContinue = (e: React.MouseEvent, courseId: string) => {
    e.preventDefault();
    navigate(`/course/${courseId}`);
  };

   const formatDuration = (minutes: number | null) => {
     if (!minutes) return "N/A";
     const hours = Math.floor(minutes / 60);
     const mins = minutes % 60;
     if (hours === 0) return `${mins} min`;
     if (mins === 0) return `${hours} hours`;
     return `${hours}h ${mins}m`;
   };
 
  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={!!user} userName={user?.email?.split("@")[0]} />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-display font-bold mb-2">
              Explore Courses
            </h1>
            <p className="text-muted-foreground">
              Discover our focus-first learning catalog
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>

           {/* Loading State */}
           {loadingCourses ? (
             <div className="flex items-center justify-center py-12">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
           ) : (
             <>
               {/* Course Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredCourses.map((course, index) => {
                   const enrolled = isEnrolledInCourse(course.id);
                   const isCurrentlyEnrolling = enrollingCourseId === course.id;
                   const category = courseCategories[course.id] || "Programming";
 
                   return (
                     <motion.div
                       key={course.id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.5, delay: 0.05 * index }}
                       className="group"
                     >
                       <div className="rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                         {/* Thumbnail */}
                         <div className="relative aspect-video overflow-hidden">
                           <img
                             src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop"}
                             alt={course.title}
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                           
                           {/* Enrolled Badge */}
                           {enrolled && (
                             <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-success text-success-foreground text-xs font-medium flex items-center gap-1">
                               <CheckCircle className="w-3 h-3" />
                               Enrolled
                             </div>
                           )}
 
                           <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                             <span className="text-xs text-white/80 flex items-center gap-1">
                               <Clock className="w-3 h-3" />
                               {formatDuration(course.duration_minutes)}
                             </span>
                             <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-glow">
                               <Play className="w-4 h-4 text-primary-foreground" />
                             </div>
                           </div>
                         </div>
 
                         {/* Content */}
                         <div className="p-4 flex-1 flex flex-col">
                           <div className="flex items-center gap-2 mb-2">
                             <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                               {category}
                             </span>
                           </div>
 
                           <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                             {course.title}
                           </h3>
                           <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                             {course.description}
                           </p>
 
                           {/* Stats */}
                           <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                             <span className="flex items-center gap-1">
                               <BookOpen className="w-3 h-3" />
                               {course.lessons_count || 0} lessons
                             </span>
                             <span className="flex items-center gap-1">
                               <Users className="w-3 h-3" />
                               {Math.floor(Math.random() * 2000) + 500}
                             </span>
                             <span className="flex items-center gap-1">
                               <Star className="w-3 h-3 text-warning" />
                               {(4.5 + Math.random() * 0.5).toFixed(1)}
                             </span>
                           </div>
 
                           {/* Action Button */}
                           {enrolled ? (
                             <Button
                               variant="secondary"
                               size="sm"
                               className="w-full mt-auto"
                               onClick={(e) => handleContinue(e, course.id)}
                             >
                               Continue Learning
                             </Button>
                           ) : (
                             <Button
                               variant="hero"
                               size="sm"
                               className="w-full mt-auto"
                               onClick={(e) => handleEnroll(e, course.id)}
                               disabled={isCurrentlyEnrolling}
                             >
                               {isCurrentlyEnrolling ? (
                                 <>
                                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                   Enrolling...
                                 </>
                               ) : (
                                 "Enroll Now"
                               )}
                             </Button>
                           )}
                         </div>
                       </div>
                     </motion.div>
                   );
                 })}
               </div>
 
               {filteredCourses.length === 0 && (
                 <div className="text-center py-12">
                   <p className="text-muted-foreground">No courses found matching your criteria.</p>
                 </div>
               )}
             </>
           )}
        </div>
      </main>
    </div>
  );
};

export default Courses;
