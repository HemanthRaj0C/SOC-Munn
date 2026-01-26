'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderFive } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { toast, Toaster } from 'sonner';

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

// Component to handle URL params toast
function ToastHandler() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    
    if (error) {
      toast.error(decodeURIComponent(error));
      window.history.replaceState({}, '', '/login');
    }
    if (success) {
      toast.success(decodeURIComponent(success));
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  return null;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Handle redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(user.role === 'admin' ? '/admin/submissions' : '/user/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  // Show centered loader while checking authentication
  if (authLoading) {
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
      <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-white p-8 dark:bg-black">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          SOC Challenge Platform
        </h2>
        
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="my-8" onSubmit={handleSubmit}>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </LabelInputContainer>

          <LabelInputContainer className="mb-8">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </LabelInputContainer>

          <button
            type="submit"
            className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer"
          >
            Login →
            <BottomGradient />
          </button>
        </form>
      </div>
      </div>
    </>
  );
}
