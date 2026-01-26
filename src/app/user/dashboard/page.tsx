'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { LoaderFive } from '@/components/ui/loader';
import SpotlightCard from '@/components/SpotlightCard';
import { cn } from '@/lib/utils';
import { toast, Toaster } from 'sonner';
import { Badge } from '@/components/ui/badge';


interface ProblemStatement {
  psNumber: number;
  title: string;
  totalQuestions: number;
  completedQuestions: number;
  score: number;
}

// Component to handle URL params toast
function ToastHandler() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    
    if (error) {
      toast.error(decodeURIComponent(error));
      window.history.replaceState({}, '', '/user/dashboard');
    }
    if (success) {
      toast.success(decodeURIComponent(success));
      window.history.replaceState({}, '', '/user/dashboard');
    }
  }, [searchParams]);

  return null;
}

export default function UserDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'user') {
      router.push('/login');
      return;
    }

    fetchDashboard();
  }, [user, authLoading, router]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/user/dashboard');
      setTeamName(response.data.teamName);
      setTotalScore(response.data.totalScore);
      setProblemStatements(response.data.problemStatements);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (psNumber: number) => {
    router.push(`/user/ps/${psNumber}`);
  };

  const getProgressColor = (completed: number, total: number) => {
    const ratio = completed / total;
    if (ratio === 1) return 'from-green-600 to-green-400';
    if (ratio >= 0.5) return 'from-yellow-600 to-yellow-400';
    if (ratio > 0) return 'from-blue-600 to-blue-400';
    return 'from-neutral-600 to-neutral-500';
  };

  const getSpotlightColor = (completed: number, total: number) => {
    const ratio = completed / total;
    if (ratio === 1) return 'rgba(34, 197, 94, 0.3)';
    if (ratio >= 0.5) return 'rgba(234, 179, 8, 0.3)';
    if (ratio > 0) return 'rgba(59, 130, 246, 0.3)';
    return 'rgba(100, 100, 100, 0.2)';
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoaderFive text="Loading" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors />
      <Suspense fallback={null}>
        <ToastHandler />
      </Suspense>
      <div className="min-h-screen bg-black">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 rounded-b-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-2xl font-bold text-white">SOC CTF Challenge</h1>
              <div className="flex items-center gap-4">
                <button
                  onClick={logout}
                  className="group/btn relative px-4 py-2 text-sm rounded-md bg-linear-to-br from-red-900 to-red-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] hover:from-red-800 hover:to-red-500 transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Score Summary */}
          <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">Welcome, {teamName}!</h2>
                <p className="text-neutral-400">Complete CTF challenges to earn points</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-400 mb-1">Total Score</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {totalScore}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-white">Problem Statements</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problemStatements.map((ps) => (
              <SpotlightCard
                key={ps.psNumber}
                spotlightColor={getSpotlightColor(ps.completedQuestions, ps.totalQuestions)}
                className="cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              >
                <div onClick={() => handleCardClick(ps.psNumber)} className="p-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">PS {ps.psNumber}</p>
                      <h3 className="text-lg font-bold text-white leading-tight">{ps.title}</h3>
                    </div>
                    {ps.completedQuestions === ps.totalQuestions && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        Complete
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-neutral-400">Progress</span>
                      <span className="text-white font-medium">
                        {ps.completedQuestions}/{ps.totalQuestions}
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full bg-gradient-to-r transition-all duration-500",
                          getProgressColor(ps.completedQuestions, ps.totalQuestions)
                        )}
                        style={{ width: `${(ps.completedQuestions / ps.totalQuestions) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-neutral-400 text-sm">Score</span>
                    <span className={cn(
                      "font-bold text-lg",
                      ps.score > 0 ? "text-cyan-400" : "text-neutral-500"
                    )}>
                      {ps.score > 0 ? `+${ps.score}` : ps.score}
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>

          {/* Scoring Info */}
          <div className="mt-8 p-6 rounded-xl bg-neutral-900/50 border border-neutral-800">
            <h3 className="text-lg font-semibold text-white mb-3">Scoring System</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400">🩸</span>
                </div>
                <div>
                  <p className="text-white font-medium">First Blood</p>
                  <p className="text-neutral-400">+45 points</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400">✓</span>
                </div>
                <div>
                  <p className="text-white font-medium">Correct Answer</p>
                  <p className="text-neutral-400">+30 points</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400">✗</span>
                </div>
                <div>
                  <p className="text-white font-medium">Wrong Answer</p>
                  <p className="text-neutral-400">-5 points</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
