import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export function WaveformPlayer({ audioUrl, onTimeUpdate, onReady }) {
    const containerRef = useRef(null);
    const wavesurfer = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        wavesurfer.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: 'rgba(109, 40, 217, 0.5)', // primary color with opacity
            progressColor: '#22d3ee', // accent color
            cursorColor: '#db2777', // secondary color
            barWidth: 2,
            barGap: 3,
            height: 80,
            responsive: true,
            normalize: true,
            backend: 'WebAudio',
        });

        wavesurfer.current.load(audioUrl);

        wavesurfer.current.on('ready', () => {
            setDuration(wavesurfer.current.getDuration());
            if (onReady) onReady();
        });

        wavesurfer.current.on('audioprocess', () => {
            const time = wavesurfer.current.getCurrentTime();
            setCurrentTime(time);
            if (onTimeUpdate) onTimeUpdate(time);
        });

        wavesurfer.current.on('seek', () => {
            const time = wavesurfer.current.getCurrentTime();
            setCurrentTime(time);
            if (onTimeUpdate) onTimeUpdate(time);
        });

        wavesurfer.current.on('finish', () => {
            setIsPlaying(false);
        });

        return () => {
            if (wavesurfer.current) {
                wavesurfer.current.destroy();
            }
        };
    }, [audioUrl]);

    const togglePlayPause = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (wavesurfer.current) {
            wavesurfer.current.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full space-y-4 bg-surface-light/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
            <div ref={containerRef} className="w-full" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePlayPause}
                        className="h-10 w-10 rounded-full bg-primary/20 hover:bg-primary/30 text-primary"
                    >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                    </Button>

                    <div className="text-sm font-mono text-gray-400">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="text-gray-400 hover:text-white"
                >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
}
