import React, { useState } from 'react';
import { Upload, Music, FileAudio, Youtube } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export function UploadZone({ onFileSelect, onAnalyzeYoutube, isUploading }) {
    const [isDragging, setIsDragging] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            onFileSelect(file);
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileSelect(file);
        }
    };

    const handleYoutubeSubmit = (e) => {
        e.preventDefault();
        if (youtubeUrl.trim()) {
            onAnalyzeYoutube(youtubeUrl.trim());
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-4 bg-surface-light/30 border-white/5">
                <form onSubmit={handleYoutubeSubmit} className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <div className="relative">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                            <input
                                type="url"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="Paste YouTube URL..."
                                className="w-full bg-surface-light border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={!youtubeUrl.trim() || isUploading}
                        className="w-full md:w-auto whitespace-nowrap"
                    >
                        Analyze YouTube
                    </Button>
                </form>
            </Card>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-gray-500">Or upload file</span>
                </div>
            </div>

            <Card
                className={cn(
                    "relative flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 min-h-[300px]",
                    isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-white/10 hover:border-white/20"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept="audio/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={handleFileInput}
                    disabled={isUploading}
                />

                <div className="flex flex-col items-center space-y-6 text-center pointer-events-none">
                    <div className="relative">
                        <div className="absolute -inset-4 rounded-full bg-primary/20 blur-xl animate-pulse-slow" />
                        <div className="relative rounded-full bg-surface-light p-6 shadow-2xl ring-1 ring-white/10">
                            <Music className="h-12 w-12 text-primary" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold tracking-tight text-white">
                            Upload your track
                        </h3>
                        <p className="text-gray-400 max-w-xs mx-auto">
                            Drag and drop your audio file here, or click to browse
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FileAudio className="h-4 w-4" />
                        <span>Supports MP3, WAV, AAC</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
