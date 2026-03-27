import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, ChevronUp, ChevronDown, HelpCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceCommand } from "@/hooks/useVoiceControl";

interface VoiceControlPanelProps {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  commandHistory: VoiceCommand[];
  onToggle: () => void;
  supportedCommands: string[];
}

const VoiceControlPanel = ({
  isListening,
  isSupported,
  transcript,
  commandHistory,
  onToggle,
  supportedCommands,
}: VoiceControlPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  if (!isSupported) return null;

  const commandGroups = [
    { label: "Playback", cmds: ["play", "pause", "stop", "resume", "mute", "unmute", "volume up", "volume down"] },
    { label: "Navigation", cmds: ["next lesson", "previous lesson", "go back", "skip forward", "skip backward"] },
    { label: "Quiz", cmds: ["open quiz", "submit quiz", "option a", "option b", "option c", "option d"] },
    { label: "Other", cmds: ["open chat", "close chat", "read lesson", "fullscreen", "help"] },
  ];

  return (
    <>
      {/* Floating Voice Control Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-border bg-secondary/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isListening ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                    <span className="text-sm font-semibold">
                      Voice Mode {isListening ? "Active" : "Off"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* Live transcript */}
                {isListening && transcript && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs text-muted-foreground italic truncate"
                  >
                    🎤 "{transcript}"
                  </motion.div>
                )}
              </div>

              {/* Help Panel */}
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 max-h-60 overflow-y-auto custom-scrollbar">
                      <p className="text-xs text-muted-foreground mb-3">
                        Say any of these commands while voice mode is active:
                      </p>
                      {commandGroups.map((group) => (
                        <div key={group.label} className="mb-3">
                          <p className="text-xs font-semibold text-foreground mb-1">{group.label}</p>
                          <div className="flex flex-wrap gap-1">
                            {group.cmds.map((cmd) => (
                              <span
                                key={cmd}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                              >
                                "{cmd}"
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Command History */}
              <div className="p-4">
                {commandHistory.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                      Recent Commands
                    </p>
                    {commandHistory.slice(0, 5).map((entry, i) => (
                      <motion.div
                        key={entry.timestamp}
                        initial={i === 0 ? { opacity: 0, x: -10 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Volume2 className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-foreground font-medium">"{entry.command}"</span>
                        <span className="text-muted-foreground text-[10px] ml-auto">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    {isListening ? 'Say a command like "play" or "next lesson"' : "Enable voice mode to start"}
                  </p>
                )}
              </div>

              {/* Toggle Button inside panel */}
              <div className="p-3 border-t border-border">
                <Button
                  onClick={onToggle}
                  variant={isListening ? "destructive" : "hero"}
                  className="w-full"
                  size="sm"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" /> Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" /> Start Voice Mode
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main floating button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
            isListening
              ? "bg-primary text-primary-foreground shadow-glow animate-pulse-slow"
              : "bg-card text-foreground border border-border hover:bg-secondary"
          }`}
          aria-label="Toggle voice control panel"
        >
          {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 absolute -top-1 -right-1 bg-secondary rounded-full" />
          ) : (
            <ChevronUp className="w-3 h-3 absolute -top-1 -right-1 bg-secondary rounded-full" />
          )}
        </motion.button>
      </div>

      {/* Screen reader announcements */}
      <div aria-live="assertive" className="sr-only">
        {commandHistory[0] && `Voice command recognized: ${commandHistory[0].command}`}
      </div>
    </>
  );
};

export default VoiceControlPanel;
