'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { LoaderFive } from '@/components/ui/loader';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Check, 
  X, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Droplet,
  Trophy
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import confetti from 'canvas-confetti';


interface Question {
  index: number;
  question: string;
  hint: string;
  placeholder: string;
  isCompleted: boolean;
  score: number;
  attempts: number;
  completedAt: string | null;
  isFirstBlood: boolean;
}

interface PSData {
  psNumber: number;
  title: string;
  description: string;
  questions: Question[];
  totalScore: number;
}

export default function PSPage({ params }: { params: Promise<{ number: string }> }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [psNumber, setPsNumber] = useState<number>(0);
  const [ps, setPs] = useState<PSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [submittingQuestion, setSubmittingQuestion] = useState<number | null>(null);
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);
  const [showHints, setShowHints] = useState<{ [key: number]: boolean }>({});

  const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

  useEffect(() => {
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

  const fetchPS = async (num: number) => {
    try {
      const response = await api.get(`/user/ps/${num}`);
      setPs(response.data);
      
      // Open first unanswered question
      const firstUnanswered = response.data.questions.findIndex((q: Question) => !q.isCompleted);
      setOpenQuestion(firstUnanswered >= 0 ? firstUnanswered : null);
      
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch PS:', error);
      const message = error.response?.data?.message || 'Failed to load problem statement';
      router.push(`/user/dashboard?error=${encodeURIComponent(message)}`);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSubmitAnswer = async (questionIndex: number) => {
    const answer = answers[questionIndex]?.trim();
    if (!answer) {
      toast.error('Please enter an answer');
      return;
    }

    setSubmittingQuestion(questionIndex);
    try {
      const response = await api.post(`/user/ps/${psNumber}/check/${questionIndex}`, { answer });
      
      // Update local state with result
      setPs(prev => {
        if (!prev) return prev;
        const updatedQuestions = [...prev.questions];
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          isCompleted: response.data.isCorrect,
          score: response.data.isCorrect ? response.data.scoreChange : updatedQuestions[questionIndex].score + response.data.scoreChange,
          attempts: response.data.attempts,
          isFirstBlood: response.data.isFirstBlood
        };
        return {
          ...prev,
          questions: updatedQuestions,
          totalScore: response.data.psScore
        };
      });

      if (response.data.isCorrect) {
        // Trigger confetti on correct answer
        triggerConfetti();
        toast.success(response.data.message);
        // Move to next unanswered question
        const nextUnanswered = ps?.questions.findIndex((q, i) => i > questionIndex && !q.isCompleted);
        if (nextUnanswered !== undefined && nextUnanswered >= 0) {
          setOpenQuestion(nextUnanswered);
        }
      } else {
        toast.error(response.data.message);
      }
      
      // Clear the answer field
      setAnswers(prev => ({ ...prev, [questionIndex]: '' }));
      
    } catch (error: any) {
      console.error('Failed to submit answer:', error);
      const message = error.response?.data?.message || 'Failed to check answer';
      toast.error(message);
    } finally {
      setSubmittingQuestion(null);
    }
  };

  const toggleHint = (index: number) => {
    setShowHints(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const completedCount = ps?.questions.filter(q => q.isCompleted).length || 0;
  const totalQuestions = ps?.questions.length || 12;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoaderFive text="Loading" />
      </div>
    );
  }

  if (!ps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-xl text-white">Problem statement not found</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors />
      <div className="min-h-screen bg-black">
        {/* Header */}
        <nav className="sticky top-0 z-50 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800/50 rounded-b-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/user/dashboard')}
                  className="p-2 text-neutral-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-white">{ps.title}</h1>
                  <p className="text-xs text-neutral-500">Problem Statement {psNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Progress */}
                <div className="flex items-center gap-3 px-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-xl">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white font-medium">{completedCount}/{totalQuestions}</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Problem Description - Left Side */}
            <Card className="lg:col-span-2 bg-neutral-900/50 border-neutral-800/50 backdrop-blur-sm h-fit lg:sticky lg:top-24">
              <CardHeader className="border-b border-neutral-800/50 pb-4">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Scenario
                </CardTitle>
              </CardHeader>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <CardContent className="py-4">
                  <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed text-sm">
                    {ps.description}
                  </p>
                </CardContent>
              </ScrollArea>
            </Card>

            {/* Questions - Right Side */}
            <div className="lg:col-span-3 space-y-3">
              <h2 className="text-xl font-bold text-white mb-4">Questions</h2>
              
              {ps.questions.map((question, index) => (
                <Collapsible
                  key={index}
                  open={openQuestion === index}
                  onOpenChange={(open) => setOpenQuestion(open ? index : null)}
                >
                  <Card className={cn(
                    "bg-neutral-900/50 border-neutral-800/50 backdrop-blur-sm transition-all duration-200",
                    openQuestion !== index && "hover:bg-neutral-700/30",
                    question.isCompleted && "border-green-500/30 bg-green-900/10",
                    openQuestion === index && "ring-1 ring-neutral-700"
                  )}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer transition-colors py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Question Number */}
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                              question.isCompleted 
                                ? "bg-green-500/20 text-green-400" 
                                : "bg-neutral-800 text-neutral-400"
                            )}>
                              {question.isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                            </div>
                            
                            <div className="flex-1">
                              <p className={cn(
                                "text-sm font-medium line-clamp-1",
                                question.isCompleted ? "text-green-400" : "text-white"
                              )}>
                                {question.question}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {question.attempts > 0 && !question.isCompleted && (
                              <span className="text-xs text-neutral-500">{question.attempts} attempt{question.attempts > 1 ? 's' : ''}</span>
                            )}
                            {openQuestion === index ? (
                              <ChevronUp className="w-5 h-5 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4 px-6 space-y-4">
                        {/* Full Question */}
                        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
                          <p className="text-neutral-200 text-sm">{question.question}</p>
                        </div>

                        {/* Hint Section */}
                        <div>
                          <button
                            onClick={() => toggleHint(index)}
                            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
                          >
                            <HelpCircle className="w-4 h-4" />
                            {showHints[index] ? 'Hide Hint' : 'Show Hint'}
                          </button>
                          {showHints[index] && (
                            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                              <p className="text-sm text-yellow-200">{question.hint}</p>
                            </div>
                          )}
                        </div>

                        {/* Answer Input */}
                        {!question.isCompleted ? (
                          <div className="flex flex-col gap-3">
                            <Input
                              value={answers[index] || ''}
                              onChange={(e) => setAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                              placeholder={question.placeholder}
                              className="w-full bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:ring-cyan-500 h-11"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !submittingQuestion) {
                                  handleSubmitAnswer(index);
                                }
                              }}
                            />
                            <Button
                              onClick={() => handleSubmitAnswer(index)}
                              disabled={submittingQuestion === index || !answers[index]?.trim()}
                              className="group/btn relative block h-10 w-fit px-6 mx-auto rounded-md bg-linear-to-br font-medium text-white bg-zinc-800 from-zinc-900 to-zinc-900 shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer"
                            >
                              {submittingQuestion === index ? (
                                <Spinner className="w-4 h-4" />
                              ) : (
                                'Submit'
                              )}
                              <BottomGradient />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <Check className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">
                              Solved!
                            </span>
                          </div>
                        )}

                        {/* Attempts and Score Info */}
                        {question.attempts > 0 && !question.isCompleted && (
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span>{question.attempts} attempt{question.attempts > 1 ? 's' : ''}</span>
                            {question.score < 0 && (
                              <span className="text-red-400">Penalty: {question.score} pts</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
