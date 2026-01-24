'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Submission } from '@/types';
import { LoaderFive } from '@/components/ui/loader';
import SpotlightCard from '@/components/SpotlightCard';
import { cn } from '@/lib/utils';

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

export default function UserDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [assignedPS, setAssignedPS] = useState<number[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPS, setSelectedPS] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't do anything while auth is loading
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
      setAssignedPS(response.data.assignedPS);
      setSubmissions(response.data.submissions);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (psNumber: number) => {
    const submission = submissions.find(s => s.psNumber === psNumber);
    
    if (submission?.isCompleted) {
      alert('You have already submitted this challenge!');
      return;
    }

    if (submission?.hasStarted) {
      router.push(`/user/ps/${psNumber}`);
    } else {
      setSelectedPS(psNumber);
      setShowConfirm(true);
    }
  };

  const confirmStart = async () => {
    if (!selectedPS) return;

    try {
      await api.post(`/user/ps/${selectedPS}/start`);
      router.push(`/user/ps/${selectedPS}`);
    } catch (error) {
      console.error('Failed to start challenge:', error);
      alert('Failed to start challenge');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderFive text="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <nav className="bg-neutral-900 shadow-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">SOC Challenge</h1>
          <div className="flex items-center gap-4">
            <span className="text-neutral-300">{teamName}</span>
            <button
              onClick={logout}
              className="group/btn relative px-4 py-2 text-sm rounded-md bg-gradient-to-br from-red-900 to-red-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] hover:from-red-800 hover:to-red-500"
            >
              Logout
              <BottomGradient />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8 text-white">Your Challenges</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedPS.map((psNumber) => {
            const submission = submissions.find(s => s.psNumber === psNumber);
            return (
              <SpotlightCard
                key={psNumber}
                spotlightColor={submission?.isCompleted ? 'rgba(34, 197, 94, 0.3)' : submission?.hasStarted ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.3)'}
                className={cn(
                  "cursor-pointer transition-all duration-300",
                  submission?.isCompleted ? 'opacity-70' : 'hover:scale-105'
                )}
              >
                <div onClick={() => handleCardClick(psNumber)}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Problem Statement {psNumber}</h3>
                    {submission?.isCompleted && (
                      <span className="px-2 py-1 text-xs bg-green-500 text-white rounded">
                        Completed
                      </span>
                    )}
                    {submission?.hasStarted && !submission?.isCompleted && (
                      <span className="px-2 py-1 text-xs bg-yellow-500 text-white rounded">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-400">
                    {submission?.isCompleted
                      ? 'Challenge completed!'
                      : submission?.hasStarted
                      ? 'Continue your challenge'
                      : 'Click to start'}
                  </p>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 p-8 rounded-lg max-w-md">
            <h3 className="text-2xl font-bold mb-4 text-white">Are you sure?</h3>
            <p className="text-neutral-400 mb-6">
              Once you start, the timer will begin. You can only submit this challenge once.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="group/btn relative flex-1 px-4 py-2 rounded-md bg-gradient-to-br from-neutral-800 to-neutral-700 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] hover:from-neutral-700 hover:to-neutral-600"
              >
                Cancel
                <BottomGradient />
              </button>
              <button
                onClick={confirmStart}
                className="group/btn relative flex-1 px-4 py-2 rounded-md bg-gradient-to-br from-blue-900 to-blue-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] hover:from-blue-800 hover:to-blue-500"
              >
                Start Challenge
                <BottomGradient />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
