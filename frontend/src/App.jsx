import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import client from './api/client';
import { UploadZone } from './components/features/UploadZone';
import { AnalysisView } from './components/features/AnalysisView';
import { ProgressBar } from './components/ui/ProgressBar';
import { Card } from './components/ui/Card';

function App() {
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress since axios upload progress is fast locally
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data } = await client.post('/audio/analyze', formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setCurrentAnalysis(data);
      }, 500);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to analyze audio. Please try again.');
      setIsUploading(false);
    }
  };

  const handleAnalyzeYoutube = async (url) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const { data } = await client.post('/audio/analyze-youtube', { url });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setCurrentAnalysis(data);
      }, 500);
    } catch (err) {
      console.error('YouTube analysis failed:', err);
      setError('Failed to analyze YouTube video. Make sure the URL is valid and public.');
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto relative">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[100px]" />
        </div>

        <div className="relative z-10 p-8 max-w-6xl mx-auto min-h-screen flex flex-col">
          <AnimatePresence mode="wait">
            {!currentAnalysis ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center space-y-8"
              >
                <div className="text-center space-y-4">
                  <h1 className="text-5xl font-bold tracking-tight">
                    <span className="text-gradient">Visualize</span> Your Music
                  </h1>
                  <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Upload any audio file to instantly generate chords, tabs, and detailed musical analysis using AI.
                  </p>
                </div>

                <div className="w-full max-w-xl space-y-6">
                  <UploadZone
                    onFileSelect={handleFileUpload}
                    onAnalyzeYoutube={handleAnalyzeYoutube}
                    isUploading={isUploading}
                  />

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Analyzing track...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <ProgressBar progress={uploadProgress} />
                    </div>
                  )}

                  {error && (
                    <Card className="bg-red-500/10 border-red-500/20 text-red-400 text-center py-3">
                      {error}
                    </Card>
                  )}
                </div>
              </motion.div>
            ) : (
              <AnalysisView
                analysis={currentAnalysis}
                onBack={() => setCurrentAnalysis(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
