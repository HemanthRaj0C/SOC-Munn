// @ts-nocheck

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Code from '@editorjs/code';
import { LoaderFive } from '@/components/ui/loader';
import { toast, Toaster } from 'sonner';
import Counter from '@/components/Counter';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Clock, FileText, Send, ArrowLeft } from 'lucide-react';

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

// Timer component with HH:MM:SS display
const TimerDisplay = ({ elapsedTime }: { elapsedTime: number }) => {
  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Math.floor((elapsedTime % 3600) / 60);
  const seconds = elapsedTime % 60;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        <Counter 
          value={hours} 
          fontSize={20}
          padding={2}
          gap={1}
          places={[10, 1]}
          horizontalPadding={4}
          borderRadius={4}
          textColor="#60a5fa"
          fontWeight="700"
          gradientHeight={0}
        />
      </div>
      <span className="text-blue-400 font-bold text-lg">:</span>
      <div className="flex items-center">
        <Counter 
          value={minutes} 
          fontSize={20}
          padding={2}
          gap={1}
          places={[10, 1]}
          horizontalPadding={4}
          borderRadius={4}
          textColor="#60a5fa"
          fontWeight="700"
          gradientHeight={0}
        />
      </div>
      <span className="text-blue-400 font-bold text-lg">:</span>
      <div className="flex items-center">
        <Counter 
          value={seconds} 
          fontSize={20}
          padding={2}
          gap={1}
          places={[10, 1]}
          horizontalPadding={4}
          borderRadius={4}
          textColor="#60a5fa"
          fontWeight="700"
          gradientHeight={0}
        />
      </div>
    </div>
  );
};

export default function PSPage({ params }: { params: Promise<{ number: string }> }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const editorRef = useRef<EditorJS | null>(null);
  const [psNumber, setPsNumber] = useState<number>(0);
  const [ps, setPs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) return;
    
    params.then(resolvedParams => {
      const num = parseInt(resolvedParams.number);
      setPsNumber(num);
      
      if (!user || user.role !== 'user') {
        router.push('/login');
        return;
      }

      fetchPS(num);
    });
  }, [params, user, authLoading, router]);

  useEffect(() => {
    if (ps?.submission?.hasStarted && !ps?.submission?.isCompleted) {
      const interval = setInterval(() => {
        const start = new Date(ps.submission.startTime).getTime();
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [ps]);

  useEffect(() => {
    if (ps && !editorRef.current) {
      initEditor();
    }
  }, [ps]);

  const fetchPS = async (num: number) => {
    try {
      const response = await api.get(`/user/ps/${num}`);
      setPs(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch PS:', error);
      
      // Check if it's a 403 error
      if (error.response?.status === 403) {
        const message = error.response?.data?.message || 'Access denied';
        router.push(`/user/dashboard?error=${encodeURIComponent(message)}`);
      } else {
        // Other errors, redirect to dashboard
        router.push(`/user/dashboard?error=${encodeURIComponent('Failed to load problem statement')}`);
      }
      // Don't set loading to false here - keep showing loader until redirect completes
    }
  };

  const initEditor = () => {
    editorRef.current = new EditorJS({
      holder: 'editorjs',
      tools: {
        header: Header,
        list: List,
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
        },
        code: Code,
      },
      placeholder: 'Write your report here...',
    });
  };

  const handleSubmit = async () => {
    if (!editorRef.current) return;
    
    // Prevent multiple submissions (race condition)
    if (submitting) return;

    try {
      setSubmitting(true);
      const content = await editorRef.current.save();
      
      // Client-side size check for better UX (5MB limit)
      const contentSize = JSON.stringify(content).length;
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (contentSize > MAX_SIZE) {
        toast.warning('Your submission is too large. Please reduce the content size.');
        setSubmitting(false);
        return;
      }
      
      await api.post(`/user/ps/${psNumber}/submit`, { content });
      router.push('/user/dashboard?success=Challenge submitted successfully!');
    } catch (error: any) {
      console.error('Failed to submit:', error);
      const message = error.response?.data?.message || 'Failed to submit challenge';
      toast.error(message);
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderFive text="Loading" />
      </div>
    );
  }

  if (!ps) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Problem statement not found</div>
      </div>
    );
  }

  const isCompleted = ps.submission?.isCompleted;

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors />
      <div className="min-h-screen">
        {/* Header */}
        <nav className="sticky top-0 z-50 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800/50 rounded-b-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-lg font-semibold text-white">Problem Statement {psNumber}</h1>
              
              <div className="flex items-center gap-4">
                {/* Timer */}
                <div className="flex items-center gap-3 px-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-xl">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <TimerDisplay elapsedTime={elapsedTime} />
                </div>
                
                <button
                  onClick={() => router.push('/user/dashboard')}
                  className="group/btn relative flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 text-neutral-300 hover:text-white transition-all"
                >
                  <span className="hidden sm:inline">Back to</span>
                  <span>Dashboard</span>
                  <BottomGradient />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
            {/* Problem Description */}
            <Card className="bg-neutral-900/50 border-neutral-800/50 backdrop-blur-sm overflow-hidden flex flex-col">
              <CardHeader className="border-b border-neutral-800/50 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-lg text-white">{ps.title}</CardTitle>
                      <p className="text-xs text-neutral-500 mt-0.5">Problem Statement</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="prose prose-invert prose-sm max-w-none py-4 px-6">
                    <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed text-sm">{ps.description}</p>
                    {ps.details && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          Incident Details
                        </h4>
                        <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-neutral-400 text-xs font-mono">{JSON.stringify(ps.details, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Card>

            {/* Editor Section */}
            <div className="flex flex-col gap-4">
              <Card className="bg-neutral-900/50 border-neutral-800/50 backdrop-blur-sm flex-1 overflow-hidden flex flex-col">
                <CardHeader className="border-b border-neutral-800/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-lg text-white">Your Report</CardTitle>
                      <p className="text-xs text-neutral-500 mt-0.5">Write your analysis and findings</p>
                    </div>
                  </div>
                </CardHeader>
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div id="editorjs" className="prose prose-invert prose-sm max-w-none min-h-[200px] py-4 px-6"></div>
                  </ScrollArea>
                </div>
              </Card>

              {/* Submit Section */}
              <Card className="bg-neutral-900/50 border-neutral-800/50 backdrop-blur-sm">
                <CardContent className="py-4 px-6">
                  <Button
                    onClick={handleSubmit}
                    disabled={isCompleted || submitting}
                    className={cn(
                      "w-full h-11 text-sm font-semibold rounded-lg transition-all duration-300",
                      isCompleted 
                        ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700" 
                        : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                    )}
                  >
                    {isCompleted ? (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neutral-500"></span>
                        Already Submitted
                      </span>
                    ) : submitting ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="size-4" />
                        Submitting Report...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Submit Report
                      </span>
                    )}
                  </Button>
                  {isCompleted && (
                    <p className="text-center text-xs text-neutral-500 mt-3">
                      You have already submitted this challenge
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
