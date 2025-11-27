import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Music2, Clock, Mic2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TabDisplay } from './TabDisplay';
import { WaveformPlayer } from './WaveformPlayer';
import { cn } from '../../lib/utils';

export function AnalysisView({ analysis, onBack }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [activeChordIndex, setActiveChordIndex] = useState(-1);

  // Find the active chord based on current time
  useEffect(() => {
    if (!analysis.chords || !Array.isArray(analysis.chords)) return;

    const index = analysis.chords.findIndex(chord => {
      const start = chord.time;
      const end = chord.time + chord.duration;
      return currentTime >= start && currentTime < end;
    });

    setActiveChordIndex(index);
  }, [currentTime, analysis.chords]);

  // Group chords by section for display, but keep flat list for playback sync
  const sections = analysis.chords.reduce((acc, chord, index) => {
    const lastSection = acc[acc.length - 1];
    if (lastSection && lastSection.name === chord.section) {
      lastSection.chords.push({ ...chord, originalIndex: index });
    } else {
      acc.push({
        name: chord.section,
        chords: [{ ...chord, originalIndex: index }]
      });
    }
    return acc;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>
        <div className="text-sm text-gray-400">
          Analyzed on {new Date(analysis.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Title Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          {analysis.fileName || 'Untitled Track'}
        </h2>
        {analysis.source?.type === 'youtube' && (
          <a
            href={analysis.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View on YouTube
          </a>
        )}
      </div>

      {/* Waveform Player */}
      <WaveformPlayer
        audioUrl={analysis.audioUrl}
        onTimeUpdate={setCurrentTime}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Chords */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6 bg-surface/50 backdrop-blur-xl border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Music2 className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold text-gradient">Chord Progression</h3>
            </div>

            <div className="space-y-8">
              {sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    {section.name}
                    {section.chords.some(c => c.originalIndex === activeChordIndex) && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {section.chords.map((chord, cIdx) => {
                      const isActive = chord.originalIndex === activeChordIndex;
                      return (
                        <motion.div
                          key={cIdx}
                          animate={{
                            scale: isActive ? 1.15 : 1,
                            backgroundColor: isActive ? 'rgba(139, 92, 246, 0.3)' : 'rgba(30, 41, 59, 0.4)', // violet-500/30
                            borderColor: isActive ? 'rgba(139, 92, 246, 0.8)' : 'rgba(255, 255, 255, 0.05)',
                            boxShadow: isActive ? '0 0 20px rgba(139, 92, 246, 0.4)' : 'none',
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className={cn(
                            "px-5 py-4 rounded-xl border transition-colors duration-200 min-w-[90px] text-center flex flex-col items-center justify-center relative overflow-hidden",
                            isActive ? "z-10" : "z-0"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-chord-glow"
                              className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-sm"
                              initial={false}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                          <span className={cn(
                            "font-bold text-2xl relative z-10",
                            isActive ? "text-white text-shadow-lg" : "text-gray-400"
                          )}>
                            {chord.chord}
                          </span>
                          {isActive && (
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: chord.duration, ease: "linear" }}
                              className="absolute bottom-0 left-0 h-1 bg-primary/50"
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <TabDisplay tabs={analysis.tabs} />
        </div>

        {/* Sidebar - Info */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6 bg-surface/50 backdrop-blur-xl border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Mic2 className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-semibold">Song Info</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400">Tuning</span>
                <span className="font-mono text-sm">{analysis.tabs?.tuning || 'Standard'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400">Key</span>
                <span>C Major</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400">Tempo</span>
                <span>120 BPM</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-white/10">
            <h4 className="font-semibold mb-2 text-white">AI Analysis</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              {analysis.summary}
            </p>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
