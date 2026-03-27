import { useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import VideoPlayer from "@/components/course/VideoPlayer";
import Quiz from "@/components/course/Quiz";
import AIChatbot from "@/components/course/AIChatbot";
import VoiceControlPanel from "@/components/course/VoiceControlPanel";
import LessonNotes from "@/components/course/LessonNotes";
import InterviewQuestions from "@/components/course/InterviewQuestions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseView } from "@/hooks/useCourseView";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceControl } from "@/hooks/useVoiceControl";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Lock,
  Play,
  Clock,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

const CourseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { courseTitle, lessons, loading, error, markVideoCompleted, saveQuizScore } = useCourseView(id);
  const { toast } = useToast();

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [triggerQuizSubmit, setTriggerQuizSubmit] = useState(0);

  // Refs for video player control
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentLesson = lessons[currentLessonIndex];
  const completedCount = lessons.filter((l) => l.completed).length;
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleVoiceCommand = useCallback((command: string) => {
    const video = document.querySelector("video") as HTMLVideoElement | null;

    switch (command) {
      case "play":
      case "resume":
        video?.play();
        speak("Playing");
        break;
      case "pause":
      case "stop":
        video?.pause();
        speak("Paused");
        break;
      case "mute":
        if (video) { video.muted = true; }
        speak("Muted");
        break;
      case "unmute":
        if (video) { video.muted = false; }
        speak("Unmuted");
        break;
      case "volume up":
        if (video) { video.volume = Math.min(1, video.volume + 0.2); }
        speak("Volume up");
        break;
      case "volume down":
        if (video) { video.volume = Math.max(0, video.volume - 0.2); }
        speak("Volume down");
        break;
      case "skip forward":
        if (video) { video.currentTime = Math.min(video.duration, video.currentTime + 10); }
        break;
      case "skip backward":
      case "rewind":
        if (video) { video.currentTime = Math.max(0, video.currentTime - 10); }
        break;
      case "fullscreen":
        document.querySelector(".relative.rounded-xl")?.requestFullscreen?.();
        break;
      case "exit fullscreen":
        if (document.fullscreenElement) document.exitFullscreen();
        break;
      case "next":
      case "next lesson":
        goToNextLesson();
        speak("Next lesson");
        break;
      case "previous":
      case "previous lesson":
      case "go back":
        goToPreviousLesson();
        speak("Previous lesson");
        break;
      case "open quiz":
      case "start quiz":
        if (currentLesson?.quiz && videoCompleted) {
          setShowQuiz(true);
          speak("Opening quiz");
        } else {
          speak("Please complete the video first");
        }
        break;
      case "option a":
      case "select a":
        setSelectedQuizOption(0);
        speak("Selected option A");
        break;
      case "option b":
      case "select b":
        setSelectedQuizOption(1);
        speak("Selected option B");
        break;
      case "option c":
      case "select c":
        setSelectedQuizOption(2);
        speak("Selected option C");
        break;
      case "option d":
      case "select d":
        setSelectedQuizOption(3);
        speak("Selected option D");
        break;
      case "submit":
      case "submit quiz":
        setTriggerQuizSubmit((p) => p + 1);
        speak("Submitting quiz");
        break;
      case "open chat":
        setIsChatOpen(true);
        speak("Opening chat");
        break;
      case "close chat":
        setIsChatOpen(false);
        speak("Closing chat");
        break;
      case "read lesson":
      case "read title":
        if (currentLesson) {
          speak(`Current lesson: ${currentLesson.title}. Lesson ${currentLessonIndex + 1} of ${lessons.length}.`);
        }
        break;
      case "help":
      case "commands":
        speak("Available commands: play, pause, next lesson, previous lesson, open quiz, option A through D, submit quiz, open chat, read lesson, and help.");
        break;
    }

    toast({
      title: "🎤 Voice Command",
      description: `"${command}"`,
      duration: 2000,
    });
  }, [currentLesson, videoCompleted, currentLessonIndex, lessons.length, speak, toast]);

  const voiceControl = useVoiceControl({
    onCommand: handleVoiceCommand,
    enabled: true,
  });

  const handleVideoComplete = () => {
    if (currentLesson) {
      markVideoCompleted(currentLesson.id);
      setVideoCompleted(true);
      if (currentLesson.quiz) {
        setShowQuiz(true);
      }
    }
  };

  const handleQuizComplete = (passed: boolean, score?: number) => {
    if (currentLesson && score !== undefined) {
      saveQuizScore(currentLesson.id, score, passed);
    }
    if (passed) {
      setQuizPassed(true);
    }
  };

  const goToNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      resetLessonState();
    }
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      resetLessonState();
    }
  };

  const selectLesson = (index: number) => {
    const lesson = lessons[index];
    const firstIncomplete = lessons.findIndex((l) => !l.completed);
    const canSelect = lesson.completed || index === firstIncomplete;
    if (canSelect) {
      setCurrentLessonIndex(index);
      resetLessonState();
    }
  };

  const resetLessonState = () => {
    setVideoCompleted(false);
    setShowQuiz(false);
    setQuizPassed(false);
    setSelectedQuizOption(null);
  };

  // Auth guard
  if (!authLoading && !user) {
    navigate("/login");
    return null;
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={!!user} userName={user?.user_metadata?.full_name} />
        <main className="pt-20 p-6 max-w-7xl mx-auto">
          <Skeleton className="w-full aspect-video rounded-xl mb-6" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </main>
      </div>
    );
  }

  if (error || !currentLesson) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={!!user} userName={user?.user_metadata?.full_name} />
        <main className="pt-20 p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Could not load course</h2>
          <p className="text-muted-foreground mb-4">{error || "No lessons found"}</p>
          <Button variant="secondary" onClick={() => navigate("/courses")}>
            Back to Courses
          </Button>
        </main>
      </div>
    );
  }

  const canAdvance = quizPassed || currentLesson.completed || (!currentLesson.quiz && videoCompleted);

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={!!user} userName={user?.user_metadata?.full_name} />

      <main className="pt-20">
        <div className="flex flex-col lg:flex-row">
          {/* Video/Quiz Area */}
          <div className="flex-1 p-4 lg:p-6">
            <AnimatePresence mode="wait">
              {!showQuiz ? (
                <motion.div
                  key={`video-${currentLesson.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <VideoPlayer
                    src={currentLesson.videoUrl}
                    title={currentLesson.title}
                    onComplete={handleVideoComplete}
                  />
                </motion.div>
              ) : currentLesson.quiz ? (
                <motion.div
                  key={`quiz-${currentLesson.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Quiz
                    questions={currentLesson.quiz.questions}
                    onComplete={handleQuizComplete}
                    passed={quizPassed}
                    voiceSelectedOption={selectedQuizOption}
                    voiceTriggerSubmit={triggerQuizSubmit}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Lesson Info & Navigation */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-display font-bold">
                    {currentLesson.title}
                  </h1>
                  <p className="text-muted-foreground">
                    Lesson {currentLessonIndex + 1} of {lessons.length}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={goToPreviousLesson}
                    disabled={currentLessonIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="hero"
                    onClick={goToNextLesson}
                    disabled={!canAdvance}
                  >
                    Next Lesson
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Course Progress */}
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Course Progress</span>
                  <span className="text-sm text-primary font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Interview Questions */}
              <div className="mt-6 p-4 rounded-xl bg-card border border-border/50">
                <InterviewQuestions courseTitle={courseTitle} lessonTitle={currentLesson.title} />
              </div>

              {/* Real-time Notes */}
              <div className="mt-6 p-4 rounded-xl bg-card border border-border/50">
                <LessonNotes lessonId={currentLesson.id} lessonTitle={currentLesson.title} />
              </div>
            </div>
          </div>

          {/* Lesson Sidebar */}
          <div className="w-full lg:w-80 border-l border-border bg-card p-4 lg:min-h-[calc(100vh-5rem)]">
            <h3 className="font-semibold mb-4">{courseTitle}</h3>

            <div className="space-y-2">
              {lessons.map((lesson, index) => {
                const firstIncomplete = lessons.findIndex((l) => !l.completed);
                const isLocked = !lesson.completed && index !== firstIncomplete;
                const isCurrent = index === currentLessonIndex;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => selectLesson(index)}
                    disabled={isLocked}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      isCurrent
                        ? "bg-primary/10 border-primary border"
                        : "hover:bg-secondary border border-transparent"
                    } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          lesson.completed
                            ? "bg-success text-success-foreground"
                            : isLocked
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {lesson.completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lesson.title}</p>
                        {lesson.duration && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* AI Chat Button */}
            <div className="mt-6 pt-6 border-t border-border">
              <Button
                variant="accent"
                className="w-full"
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                <MessageCircle className="w-4 h-4" />
                Ask AI Assistant
              </Button>
            </div>
          </div>
        </div>

        {/* AI Chatbot */}
        <AIChatbot
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          lessonTitle={currentLesson.title}
        />

        {/* Voice Control Panel */}
        <VoiceControlPanel
          isListening={voiceControl.isListening}
          isSupported={voiceControl.isSupported}
          transcript={voiceControl.transcript}
          commandHistory={voiceControl.commandHistory}
          onToggle={voiceControl.toggleListening}
          supportedCommands={voiceControl.supportedCommands}
        />
      </main>
    </div>
  );
};

export default CourseView;
