'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Team } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminScoreboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedTeam, setHighlightedTeam] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update time every 10 seconds for live graph updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  // Dynamic color generation based on team count
  const generateTeamColor = (index: number) => {
    const baseColors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
    ];
    
    if (index < baseColors.length) {
      return baseColors[index];
    }
    
    // Generate additional colors dynamically
    const hue = (index * 137.5) % 360; // Golden angle for good distribution
    return `hsl(${hue}, 70%, 50%)`;
  };

  const generateGraphData = () => {
    const now = currentTime;
    const timePoints: number[] = [];
    
    // Generate time points (every 30 minutes for the last 8 hours)
    for (let i = 8; i >= 0; i--) {
      timePoints.push(now - (i * 30 * 60 * 1000));
    }

    const graphData = timePoints.map(time => {
      const dataPoint: any = { 
        time: new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };

      teams.forEach(team => {
        let cumulativeScore = 0;
        team.submissions.forEach(sub => {
          if (sub.isCompleted && sub.scoredAt) {
            const scoredTime = new Date(sub.scoredAt).getTime();
            if (scoredTime <= time) {
              cumulativeScore += sub.score || 0;
            }
          }
        });
        dataPoint[team.teamName] = cumulativeScore;
      });

      return dataPoint;
    });

    return graphData;
  };

  const handleTeamClick = (teamName: string) => {
    setHighlightedTeam(highlightedTeam === teamName ? null : teamName);
  };

  const handleLegendClick = (data: any) => {
    handleTeamClick(data.value);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/submissions')}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Review Submissions
            </button>
            <button
              onClick={fetchScoreboard}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* CTF-Style Score Progression Graph */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Score Progression</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={generateGraphData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend 
                onClick={handleLegendClick}
                wrapperStyle={{ cursor: 'pointer' }}
              />
              {teams.map((team, index) => (
                <Line
                  key={team.teamId}
                  type="monotone"
                  dataKey={team.teamName}
                  stroke={generateTeamColor(index)}
                  strokeWidth={highlightedTeam === team.teamName ? 4 : 2}
                  strokeOpacity={highlightedTeam === null || highlightedTeam === team.teamName ? 1 : 0.2}
                  dot={{ 
                    fill: generateTeamColor(index),
                    r: highlightedTeam === team.teamName ? 6 : 4,
                    strokeWidth: 0
                  }}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <h2 className="text-2xl font-bold text-white">🏆 Live Rankings</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teams.map((team, index) => {
                const isHighlighted = highlightedTeam === team.teamName;
                const teamColor = generateTeamColor(index);
                return (
                  <tr 
                    key={team.teamId} 
                    onClick={() => handleTeamClick(team.teamName)}
                    className={`cursor-pointer transition-all duration-200 ${
                      index < 3 ? 'bg-yellow-50' : ''
                    } ${
                      highlightedTeam === null || isHighlighted ? 'opacity-100' : 'opacity-40'
                    } hover:bg-blue-50`}
                    style={{
                      borderLeft: isHighlighted ? `4px solid ${teamColor}` : 'none'
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index === 0 && <span className="text-4xl mr-2">🥇</span>}
                        {index === 1 && <span className="text-4xl mr-2">🥈</span>}
                        {index === 2 && <span className="text-4xl mr-2">🥉</span>}
                        {index > 2 && <span className="text-xl font-bold text-gray-600 mr-2">{index + 1}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: teamColor }}
                        ></div>
                        <div className="text-lg font-bold text-gray-900">{team.teamName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {team.teamMembers.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-3xl font-bold" style={{ color: teamColor }}>
                        {team.totalScore || 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
