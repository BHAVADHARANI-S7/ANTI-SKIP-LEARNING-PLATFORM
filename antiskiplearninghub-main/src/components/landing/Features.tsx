import { motion } from "framer-motion";
import {
  Shield,
  Brain,
  Target,
  TrendingUp,
  MessageCircle,
  Award,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Anti-Skip Technology",
    description:
      "Videos cannot be skipped, forwarded, or sped up. Experience every second of your lessons.",
    color: "primary",
  },
  {
    icon: Brain,
    title: "AI Learning Assistant",
    description:
      "Get instant answers to your questions with our intelligent chatbot that understands your course material.",
    color: "accent",
  },
  {
    icon: Target,
    title: "Mandatory Quizzes",
    description:
      "Test your understanding after each video. No moving forward until you've proven comprehension.",
    color: "warning",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Monitor your learning journey with detailed analytics and completion statistics.",
    color: "success",
  },
  {
    icon: MessageCircle,
    title: "Interactive Learning",
    description:
      "Engage with content through notes, highlights, and discussion forums.",
    color: "primary",
  },
  {
    icon: Award,
    title: "Certificates",
    description:
      "Earn verified certificates upon course completion to showcase your achievements.",
    color: "accent",
  },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

const Features = () => {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Why Choose <span className="text-primary">ANTISKIP</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform is designed to maximize your learning outcomes with
            features that keep you focused and engaged.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div
                  className={`w-12 h-12 rounded-xl ${
                    colorClasses[feature.color as keyof typeof colorClasses]
                  } flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
