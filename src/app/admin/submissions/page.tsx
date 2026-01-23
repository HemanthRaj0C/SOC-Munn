//@ts-nocheck

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Team } from '@/types';

export default function AdminSubmissions() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [scores, setScores] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchSubmissions();
  }, [user, authLoading, router]);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/admin/submissions');
      setTeams(response.data);
      
      // Initialize scores
      const initialScores: { [key: string]: number } = {};
      response.data.forEach((team: Team) => {
        team.submissions.forEach(sub => {
          const key = `${team.teamId}-${sub.psNumber}`;
          initialScores[key] = sub.score || 0;
        });
      });
      setScores(initialScores);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (teamId: string, psNumber: number, value: string) => {
    const key = `${teamId}-${psNumber}`;
    setScores({ ...scores, [key]: parseInt(value) || 0 });
  };

  const handleScoreSubmit = async (teamId: string, psNumber: number) => {
    const key = `${teamId}-${psNumber}`;
    const score = scores[key] || 0;

    try {
      await api.post(`/admin/score/${teamId}/${psNumber}`, { score });
      alert('Score updated successfully!');
      fetchSubmissions(); // Refresh data
    } catch (error) {
      console.error('Failed to update score:', error);
      alert('Failed to update score');
    }
  };

  const viewSubmission = (team: Team, submission: any) => {
    setSelectedSubmission({
      teamName: team.teamName,
      psNumber: submission.psNumber,
      content: submission.submissionContent,
      timeTaken: submission.timeTaken,
      completedTime: submission.completedTime
    });
  };

  const closeModal = () => {
    setSelectedSubmission(null);
  };

  const formatTime = (milliseconds: number | null) => {
    if (!milliseconds) return '-';
    const seconds = Math.floor(milliseconds / 1000);
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderEditorJSContent = (content: any) => {
    if (!content || !content.blocks) return <p className="text-gray-500">No content</p>;

    return content.blocks.map((block: any, index: number) => {
      switch (block.type) {
        case 'header':
          const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
          return <HeaderTag key={index} className="font-bold my-2">{block.data.text}</HeaderTag>;
        case 'paragraph':
          return <p key={index} className="my-2">{block.data.text}</p>;
        case 'list':
          const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
          return (
            <ListTag key={index} className="list-disc ml-6 my-2">
              {block.data.items.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ListTag>
          );
        case 'code':
          return (
            <pre key={index} className="bg-gray-100 p-4 rounded my-2 overflow-x-auto">
              <code>{block.data.code}</code>
            </pre>
          );
        default:
          return <p key={index} className="my-2">{JSON.stringify(block.data)}</p>;
      }
    });
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
          <h1 className="text-2xl font-bold">Submissions & Grading</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/scoreboard')}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              View Scoreboard
            </button>
            <button
              onClick={fetchSubmissions}
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Taken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teams.flatMap((team) => 
                team.assignedPS.map((psNumber) => {
                  const submission = team.submissions.find(s => s.psNumber === psNumber);
                  const scoreKey = `${team.teamId}-${psNumber}`;
                  
                  return (
                    <tr key={`${team.teamId}-${psNumber}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{team.teamName}</div>
                        <div className="text-sm text-gray-500">{team.teamMembers.join(', ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        PS {psNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission?.isCompleted ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : submission?.hasStarted ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            In Progress
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Not Started
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission?.completedTime
                          ? new Date(submission.completedTime).toLocaleString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {formatTime(submission?.timeTaken || null)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission?.isCompleted ? (
                          <button
                            onClick={() => viewSubmission(team, submission)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">No submission</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission?.isCompleted ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={scores[scoreKey] || 0}
                            onChange={(e) => handleScoreChange(team.teamId, psNumber, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            disabled={!submission.isCompleted}
                          />
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission?.isCompleted && (
                          <button
                            onClick={() => handleScoreSubmit(team.teamId, psNumber)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for viewing submission */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{selectedSubmission.teamName}</h2>
                  <p className="text-gray-600">Problem Statement {selectedSubmission.psNumber}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Completed: {new Date(selectedSubmission.completedTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Time Taken: {formatTime(selectedSubmission.timeTaken)}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose max-w-none">
                {renderEditorJSContent(selectedSubmission.content)}
              </div>
            </div>
            <div className="p-6 border-t">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
