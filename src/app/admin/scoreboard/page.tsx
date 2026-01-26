'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { LoaderFive } from '@/components/ui/loader';
import { toast, Toaster } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Trophy, Droplet, Check, Medal } from 'lucide-react';

interface Team {
  teamId: string;
  teamName: string;
  username: string;
  teamMembers: string[];
  totalScore: number;
  completedQuestions: number;
  firstBloods: number;
}

export default function AdminScoreboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchScoreboard();
  }, [user, authLoading, router]);

  const fetchScoreboard = async () => {
    try {
      const response = await api.get('/admin/scoreboard');
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to fetch scoreboard:', error);
      toast.error('Failed to load scoreboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { emoji: '🥇', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' };
    if (index === 1) return { emoji: '🥈', bg: 'bg-neutral-400/20', text: 'text-neutral-300', border: 'border-neutral-400/50' };
    if (index === 2) return { emoji: '🥉', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' };
    return { emoji: '', bg: 'bg-neutral-800', text: 'text-neutral-400', border: 'border-neutral-700' };
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
      <div className="min-h-screen bg-black">
        {/* Header */}
        <nav className="sticky top-0 z-50 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Leaderboard
              </h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/admin/submissions')}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all"
                >
                  View Submissions
                </button>
                <button
                  onClick={fetchScoreboard}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all"
                >
                  Refresh
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-400 transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top 3 Podium */}
          {teams.length >= 3 && (
            <div className="mb-8 grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              {/* Second Place */}
              <div className="pt-8">
                <Card className="bg-neutral-900/50 border-neutral-400/30 text-center">
                  <CardContent className="pt-6">
                    <div className="text-5xl mb-2">🥈</div>
                    <h3 className="text-lg font-bold text-white truncate">{teams[1].teamName}</h3>
                    <p className="text-3xl font-bold text-neutral-300 mt-2">{teams[1].totalScore}</p>
                    <p className="text-xs text-neutral-500 mt-1">{teams[1].completedQuestions} solved</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* First Place */}
              <div>
                <Card className="bg-gradient-to-b from-yellow-500/20 to-neutral-900/50 border-yellow-500/30 text-center">
                  <CardContent className="pt-6">
                    <div className="text-6xl mb-2">🥇</div>
                    <h3 className="text-xl font-bold text-white truncate">{teams[0].teamName}</h3>
                    <p className="text-4xl font-bold text-yellow-400 mt-2">{teams[0].totalScore}</p>
                    <p className="text-xs text-neutral-400 mt-1">{teams[0].completedQuestions} solved</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Third Place */}
              <div className="pt-12">
                <Card className="bg-neutral-900/50 border-orange-500/30 text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-2">🥉</div>
                    <h3 className="text-lg font-bold text-white truncate">{teams[2].teamName}</h3>
                    <p className="text-2xl font-bold text-orange-400 mt-2">{teams[2].totalScore}</p>
                    <p className="text-xs text-neutral-500 mt-1">{teams[2].completedQuestions} solved</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-neutral-800">
              <CardTitle className="text-xl text-white">Full Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-neutral-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Solved
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        First Bloods
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {teams.map((team, index) => {
                      const rankStyle = getRankBadge(index);
                      return (
                        <tr 
                          key={team.teamId}
                          className={cn(
                            "transition-colors hover:bg-neutral-800/50",
                            index < 3 && "bg-neutral-900/30"
                          )}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                              rankStyle.bg, rankStyle.text, "border", rankStyle.border
                            )}>
                              {rankStyle.emoji || index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-lg font-bold text-white">{team.teamName}</p>
                              <p className="text-sm text-neutral-500">{team.teamMembers?.join(', ') || team.username}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-4 h-4 text-green-400" />
                              <span className="text-white font-medium">{team.completedQuestions}/72</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Droplet className="w-4 h-4 text-red-400" />
                              <span className="text-red-400 font-medium">{team.firstBloods}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn(
                              "text-2xl font-bold",
                              index === 0 ? "text-yellow-400" :
                              index === 1 ? "text-neutral-300" :
                              index === 2 ? "text-orange-400" :
                              "text-cyan-400"
                            )}>
                              {team.totalScore}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {teams.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-neutral-400">No teams found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
