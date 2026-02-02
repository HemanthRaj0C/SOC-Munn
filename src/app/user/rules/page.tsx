'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoaderTwo } from '@/components/ui/loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoirBackground } from '@/components/ui/noir-background';
import { ParticlesBackground } from '@/components/ui/particles-background';
import { NoirDecorations } from '@/components/ui/noir-decorations';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  AlertTriangle, 
  Trophy, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle,
  XCircle,
  Droplet,
  BookOpen,
  Download,
  Server
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RulesPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const BottomGradient = () => {
    return (
      <>
        <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-red-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
        <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-red-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
      </>
    );
  };

  const DashboardGradient = () => {
    return (
      <>
        <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-amber-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
        <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-amber-600 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
      </>
    );
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'user') {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoaderTwo />
      </div>
    );
  }

  const rules = [
    {
      icon: Users,
      title: "Team Participation",
      description: "Each team can have up to 3 members. All team members must be registered before the challenge begins."
    },
    {
      icon: FileText,
      title: "Problem Statements",
      description: "There are 6 problem statements, each containing 12 questions. Questions must be answered in any order within each problem statement."
    },
    {
      icon: Trophy,
      title: "Scoring System",
      description: "Each correct answer earns points. The exact points depend on the difficulty of the question. Your total score is the sum of all correct answers."
    },
    {
      icon: Droplet,
      title: "First Blood Bonus",
      description: "The first team to correctly answer any question receives a special First Blood bonus! This adds extra points to your score."
    },
    {
      icon: AlertTriangle,
      title: "Wrong Answer Penalty",
      description: "Each wrong answer attempt deducts 5 points from your score. Think carefully before submitting! Multiple wrong attempts will accumulate penalties."
    },
    {
      icon: Clock,
      title: "Time Limit",
      description: "The challenge has a fixed duration. Once time expires, no more submissions will be accepted. Manage your time wisely across all problem statements."
    },
    {
      icon: XCircle,
      title: "Prohibited Actions",
      description: "No sharing of answers between teams. No use of automated tools or scripts to solve challenges. No attacking the platform infrastructure."
    },
    {
      icon: CheckCircle,
      title: "Fair Play",
      description: "All decisions by the organizers are final. Any form of cheating will result in immediate disqualification. Play fair and have fun!"
    }
  ];

  return (
    <NoirBackground variant="scanlines">
      {/* Particles */}
      <ParticlesBackground variant="dust" className="fixed inset-0 pointer-events-none" />
      
      {/* Noir decorations */}
      <NoirDecorations />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800/50 rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white font-mono tracking-wide">MISSION BRIEFING</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/user/dashboard')}
                className="group/btn relative px-4 py-2 text-sm rounded-md bg-amber-500/20 font-medium text-amber-400 border border-amber-500/50 transition-all cursor-pointer flex items-center gap-2 font-mono"
              >
                <FileText className="w-4 h-4" />
                CASE FILES
                <DashboardGradient />
              </button>
              <button
                onClick={logout}
                className="group/btn relative px-4 py-2 text-sm rounded-md bg-neutral-800/50 font-medium text-white shadow-[0px_1px_1px_1px_#ffffff40_inset,0px_0px_0px_0px_#ffffff40_inset] transition-all cursor-pointer font-mono"
              >
                LOGOUT
                <BottomGradient />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4 font-mono">RULES OF ENGAGEMENT</h1>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Read these rules carefully before starting your mission. Violation of any rules may result in disqualification.
          </p>
        </motion.div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-neutral-900/50 border-neutral-800/50 h-full hover:border-amber-500/30 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <rule.icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-white font-mono">{rule.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {rule.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Download Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12"
        >
          <Card className="bg-neutral-900/50 border-neutral-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Download className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-white font-mono">DOWNLOAD RESOURCES</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-400 text-sm mb-6">
                Download the required resources to complete the challenges. You can either download the VM image or use the local server.
              </p>
              <div className="flex flex-wrap gap-4">
                {/* VM Download Button */}
                <a
                  href="https://drive.google.com/your-vm-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn relative px-6 py-3 text-sm rounded-md bg-neutral-800/50 font-medium text-white shadow-[0px_1px_1px_1px_#ffffff40_inset,0px_0px_0px_0px_#ffffff40_inset] transition-all cursor-pointer font-mono flex items-center gap-2 hover:bg-neutral-700/50"
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD VM IMAGE
                  <BottomGradient />
                </a>
                
                {/* Local Server Download Button */}
                <a
                  href="http://localhost:8000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn relative px-6 py-3 text-sm rounded-md bg-neutral-800/50 font-medium text-white shadow-[0px_1px_1px_1px_#ffffff40_inset,0px_0px_0px_0px_#ffffff40_inset] transition-all cursor-pointer font-mono flex items-center gap-2 hover:bg-neutral-700/50"
                >
                  <Server className="w-4 h-4" />
                  LOCAL SERVER DOWNLOAD
                  <BottomGradient />
                </a>
              </div>
              <p className="text-neutral-500 text-xs mt-4 font-mono">
                Note: Local server requires the host to run &quot;py -m http.server&quot; on the network.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => router.push('/user/dashboard')}
            className="group/btn relative px-8 py-4 text-lg rounded-xl bg-amber-600 font-bold text-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer font-mono"
          >
            I UNDERSTAND - PROCEED TO MISSION
          </button>
          <p className="text-neutral-500 text-sm mt-4 font-mono">
            By proceeding, you agree to follow all rules outlined above.
          </p>
        </motion.div>
      </div>
    </NoirBackground>
  );
}
