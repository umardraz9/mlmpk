'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = memo(({
  onRecordingComplete,
  disabled = false,
  className
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Start recording
  const startRecording = async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;

      // Set up audio level monitoring
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };


      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);

        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start audio level monitoring
      const monitorAudioLevel = () => {
        if (!analyserRef.current || !isRecording) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1

        if (isRecording) {
          requestAnimationFrame(monitorAudioLevel);
        }
      };

      monitorAudioLevel();

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioLevel(0);

    // Clean up
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Keyboard shortcuts while recording: Space toggles pause, Enter stops
  useEffect(() => {
    if (!isRecording) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        stopRecording();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRecording]);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Recording indicator - enhanced pill */}
      {isRecording && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-red-50 dark:bg-red-900/10 border border-red-200/70 dark:border-red-800/50 shadow-sm">
          {/* Pulsing red dot */}
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-70" />
          </div>

          {/* Timer with aria-live for a11y */}
          <span className="text-sm font-mono text-red-700 dark:text-red-300" aria-live="polite">
            {formatTime(recordingTime)}
          </span>

          {/* Equalizer bars */}
          <div className="flex items-end gap-0.5 h-4">
            {Array.from({ length: 8 }).map((_, i) => {
              const factor = (Math.sin(audioLevel * 6 + i) + 1) / 2; // 0..1
              const height = 20 + factor * 60; // 20%..80%
              return (
                <div
                  key={i}
                  className="w-1 rounded-sm bg-green-500 transition-all duration-150"
                  style={{ height: `${height}%` }}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Control buttons - bigger, clearer */}
      <div className="flex items-center gap-1.5">
        {!isRecording ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={startRecording}
            disabled={disabled}
            className="h-11 w-11 p-0 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Start voice recording"
            aria-label="Start voice recording"
          >
            <Mic className="h-5 w-5 text-red-600 dark:text-red-400" />
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePause}
              className="h-11 w-11 p-0 rounded-full hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              title={isPaused ? "Resume recording" : "Pause recording"}
              aria-label={isPaused ? "Resume recording" : "Pause recording"}
            >
              {isPaused ? (
                <Play className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <Pause className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={stopRecording}
              className="h-11 w-11 p-0 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20"
              title="Stop and send recording"
              aria-label="Stop and send recording"
            >
              <Square className="h-5 w-5 text-green-600 dark:text-green-400 fill-current" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={cancelRecording}
              className="h-11 w-11 p-0 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Cancel recording"
              aria-label="Cancel recording"
            >
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">✕</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

VoiceRecorder.displayName = 'VoiceRecorder';
