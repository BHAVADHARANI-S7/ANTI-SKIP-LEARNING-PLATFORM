 import { motion } from "framer-motion";
 import { BookOpen, Clock, Award, TrendingUp, LucideIcon } from "lucide-react";
 
 interface StatsGridProps {
   coursesEnrolled: number;
   hoursLearned: number;
   quizzesPassed: number;
   completionRate: number;
 }
 
 interface StatItem {
   icon: LucideIcon;
   label: string;
   value: string | number;
   colorClass: string;
   bgClass: string;
 }
 
 const StatsGrid = ({ coursesEnrolled, hoursLearned, quizzesPassed, completionRate }: StatsGridProps) => {
   const stats: StatItem[] = [
     {
       icon: BookOpen,
       label: "Courses Enrolled",
       value: coursesEnrolled,
       colorClass: "text-primary",
       bgClass: "bg-primary/10",
     },
     {
       icon: Clock,
       label: "Hours Learned",
       value: hoursLearned,
       colorClass: "text-accent",
       bgClass: "bg-accent/10",
     },
     {
       icon: Award,
       label: "Quizzes Passed",
       value: quizzesPassed,
       colorClass: "text-warning",
       bgClass: "bg-warning/10",
     },
     {
       icon: TrendingUp,
       label: "Completion Rate",
       value: `${completionRate}%`,
       colorClass: "text-success",
       bgClass: "bg-success/10",
     },
   ];
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.1 }}
       className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
     >
       {stats.map((stat) => (
         <div
           key={stat.label}
           className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
         >
           <div className={`w-10 h-10 rounded-lg ${stat.bgClass} flex items-center justify-center mb-3`}>
             <stat.icon className={`w-5 h-5 ${stat.colorClass}`} />
           </div>
           <p className="text-2xl font-bold mb-1">{stat.value}</p>
           <p className="text-sm text-muted-foreground">{stat.label}</p>
         </div>
       ))}
     </motion.div>
   );
 };
 
 export default StatsGrid;