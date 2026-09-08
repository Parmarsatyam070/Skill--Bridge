import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

interface InterviewResponseInputProps {
  onSubmit: (answer: string) => Promise<void>;
  isSubmitting: boolean;
  minChars?: number;
  maxChars?: number;
  placeholder?: string;
  isLastQuestion?: boolean;
}

export const InterviewResponseInput: React.FC<InterviewResponseInputProps> = ({
  onSubmit,
  isSubmitting,
  minChars = 10,
  maxChars = 3000,
  placeholder = 'Type your response here. Clearly explain your reasoning, architecture, or past experiences...',
  isLastQuestion = false,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check browser speech recognition capability
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setText(prev => (prev ? `${prev.trim()} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch { }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
        setIsRecording(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (trimmed.length < minChars || trimmed.length > maxChars || isSubmitting) {
      return;
    }
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch { }
    }
    await onSubmit(trimmed);
    setText('');
  };

  const charCount = text.length;
  const isValid = charCount >= minChars && charCount <= maxChars;

  return (
    <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
        <label htmlFor="interview-answer-input" className="font-medium text-zinc-300">
          Your Response:
        </label>
        <div className="flex items-center gap-3">
          {speechSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors border ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  : 'bg-[#1A1D24] text-zinc-400 border-[#2A2E38] hover:text-zinc-200'
              }`}
              title={isRecording ? 'Stop voice recording' : 'Optional voice-to-text dictation'}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isRecording ? 'Listening...' : 'Voice Dictate'}</span>
            </button>
          )}

          <span
            className={`font-mono text-xs ${
              charCount > maxChars
                ? 'text-red-400 font-bold'
                : charCount >= minChars
                ? 'text-emerald-400'
                : 'text-zinc-500'
            }`}
          >
            {charCount} / {maxChars}
          </span>
        </div>
      </div>

      <div className="relative">
        <textarea
          id="interview-answer-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={6}
          disabled={isSubmitting}
          className="w-full bg-[#08090C] border border-[#2A2E38] rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-[#2F8C82] focus:border-transparent transition-all resize-y font-sans leading-relaxed disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="text-xs text-zinc-500">
          {charCount < minChars ? (
            <span className="flex items-center gap-1 text-amber-400/80">
              <AlertCircle className="w-3.5 h-3.5" />
              Minimum {minChars} characters required ({minChars - charCount} more needed)
            </span>
          ) : (
            <span className="text-zinc-400 hidden sm:inline">
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">Ctrl+Enter</kbd> to submit
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
            isValid && !isSubmitting
              ? 'bg-[#2F8C82] hover:bg-[#3aa398] text-white shadow-lg shadow-[#2F8C82]/20 active:scale-[0.98]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Evaluating & Advancing...</span>
            </>
          ) : isLastQuestion ? (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Submit Final Answer & Finish</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Answer & Next Question</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
