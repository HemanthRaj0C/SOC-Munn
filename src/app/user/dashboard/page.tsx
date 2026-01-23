'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Submission } from '@/types';

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
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">SOC Challenge</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{teamName}</span>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Your Challenges</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedPS.map((psNumber) => {
            const submission = submissions.find(s => s.psNumber === psNumber);
            return (
              <div
                key={psNumber}
                onClick={() => handleCardClick(psNumber)}
                className={`p-6 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg transition ${
                  submission?.isCompleted ? 'opacity-60' : 'hover:scale-105'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Problem Statement {psNumber}</h3>
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
                <p className="text-gray-600">
                  {submission?.isCompleted
                    ? 'Challenge completed!'
                    : submission?.hasStarted
                    ? 'Continue your challenge'
                    : 'Click to start'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md">
            <h3 className="text-2xl font-bold mb-4">Are you sure?</h3>
            <p className="text-gray-600 mb-6">
              Once you start, the timer will begin. You can only submit this challenge once.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStart}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
