 import { Link } from "react-router-dom";
 import { motion } from "framer-motion";
 import { Clock, Play } from "lucide-react";
 import { Progress } from "@/components/ui/progress";
 
 interface CourseCardProps {
   id: string;
   title: string;
   description: string | null;
   thumbnail_url: string | null;
   duration_minutes: number | null;
   progress: number;
   completedLessons: number;
   totalLessons: number;
   index: number;
 }
 
 const CourseCard = ({
   id,
   title,
   description,
   thumbnail_url,
   duration_minutes,
   progress,
   completedLessons,
   totalLessons,
   index,
 }: CourseCardProps) => {
   const formatDuration = (minutes: number | null) => {
     if (!minutes) return "N/A";
     const hours = Math.floor(minutes / 60);
     const mins = minutes % 60;
     if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
     return `${mins}m`;
   };
 
   const defaultThumbnail = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop";
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
       className="group"
     >
       <Link to={`/course/${id}`}>
         <div className="rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
           {/* Thumbnail */}
           <div className="relative aspect-video overflow-hidden">
             <img
               src={thumbnail_url || defaultThumbnail}
               alt={title}
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
               <span className="text-xs text-white/80 flex items-center gap-1">
                 <Clock className="w-3 h-3" />
                 {formatDuration(duration_minutes)}
               </span>
               <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-glow">
                 <Play className="w-4 h-4 text-primary-foreground" />
               </div>
             </div>
           </div>
 
           {/* Content */}
           <div className="p-4">
             <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
               {title}
             </h3>
             <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
               {description || "No description available"}
             </p>
 
             {/* Progress */}
             <div className="space-y-2">
               <div className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground">
                   {completedLessons}/{totalLessons} lessons
                 </span>
                 <span className="font-medium text-primary">{progress}%</span>
               </div>
               <Progress value={progress} className="h-2" />
             </div>
           </div>
         </div>
       </Link>
     </motion.div>
   );
 };
 
 export default CourseCard;