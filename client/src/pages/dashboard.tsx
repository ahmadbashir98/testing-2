import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { FloatingCoins } from "@/components/floating-coins";
import { MiningButton } from "@/components/mining-button";
import { StatsCards } from "@/components/stats-cards";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [miningEndTime, setMiningEndTime] = useState<Date | null>(null);

  const { data: miningSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/mining/session", user?.id],
    enabled: !!user?.id,
  });

  const { data: userData } = useQuery({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (miningSession?.endsAt) {
      setMiningEndTime(new Date(miningSession.endsAt));
    } else {
      setMiningEndTime(null);
    }
  }, [miningSession]);

  useEffect(() => {
    if (userData) {
      login(userData);
    }
  }, [userData, login]);

  const startMiningMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mining/start", { userId: user?.id });
      return await res.json();
    },
    onSuccess: (data) => {
      setMiningEndTime(new Date(data.endsAt));
      queryClient.invalidateQueries({ queryKey: ["/api/mining/session", user?.id] });
      toast({
        title: "Mining started!",
        description: "Your 24-hour mining session has begun.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start mining",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const claimRewardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mining/claim", { userId: user?.id });
      return await res.json();
    },
    onSuccess: (data) => {
      setMiningEndTime(null);
      queryClient.invalidateQueries({ queryKey: ["/api/mining/session", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      toast({
        title: "Reward claimed!",
        description: `You earned ${data.reward} PKR from mining!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to claim reward",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const isMining = !!miningSession && !miningSession.claimed;
  const isLoading =
    sessionLoading ||
    startMiningMutation.isPending ||
    claimRewardMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-950/10 pb-20">
      <header className="flex items-center justify-center gap-2 py-4 border-b border-border/50">
        <Flame className="w-8 h-8 text-amber-400" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
          CloudFire
        </h1>
      </header>

      <FloatingCoins />

      <main className="px-4 py-6 space-y-8 max-w-lg mx-auto">
        <StatsCards
          totalAssets={userData?.balance ?? user?.balance ?? 0}
          totalMiners={userData?.totalMiners ?? user?.totalMiners ?? 0}
        />

        <div className="flex justify-center py-8">
          <MiningButton
            isMining={isMining}
            endTime={miningEndTime}
            onStartMining={() => startMiningMutation.mutate()}
            onClaimReward={() => claimRewardMutation.mutate()}
            isLoading={isLoading}
          />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-foreground">How it works</h2>
          <p className="text-sm text-muted-foreground">
            Press the mining button to start a 24-hour session. After completion,
            claim your rewards! Rent more machines to increase your daily profits.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
