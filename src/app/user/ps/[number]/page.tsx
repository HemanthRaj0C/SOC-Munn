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
    } catch (error: any) {
      console.error('Failed to fetch PS:', error);
      
      // Check if it's a 403 error
      if (error.response?.status === 403) {
        const message = error.response?.data?.message || 'Access denied';
        alert(message);
        router.push('/user/dashboard');
      } else {
        // Other errors, redirect to dashboard
        alert('Failed to load problem statement');
        router.push('/user/dashboard');
      }
    } finally {
      setLoading(false);
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

    try {
      setSubmitting(true);
      const content = await editorRef.current.save();
      await api.post(`/user/ps/${psNumber}/submit`, { content });
      alert('Challenge submitted successfully!');
      router.push('/user/dashboard');
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Failed to submit challenge');
    } finally {
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
        <div className="text-xl">Loading...</div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Problem Statement {psNumber}</h1>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-mono">
              {formatTime(elapsedTime)}
            </div>
            <button
              onClick={() => router.push('/user/dashboard')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          {/* Problem Description */}
          <div className="bg-white p-6 rounded-lg shadow-md overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{ps.title}</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{ps.description}</p>
              {ps.details && (
                <div className="mt-4">
                  <h3 className="font-semibold">Details:</h3>
                  <pre className="mt-2 p-4 bg-gray-100 rounded">{JSON.stringify(ps.details, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Editor and Preview */}
          <div className="flex flex-col gap-4">
            {/* Editor */}
            <div className="bg-white p-6 rounded-lg shadow-md flex-1 overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Your Report</h3>
              <div id="editorjs" className="prose max-w-none"></div>
            </div>

            {/* Submit Button */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <button
                onClick={handleSubmit}
                disabled={isCompleted || submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isCompleted ? 'Already Submitted' : submitting ? 'Submitting...' : 'Submit Report'}
              </button>
              {isCompleted && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  You have already submitted this challenge
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
