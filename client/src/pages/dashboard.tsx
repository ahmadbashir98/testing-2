import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Flame, User, Phone } from "lucide-react";
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
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);

  const { data: miningSession, isLoading: sessionLoading, refetch: refetchSession } = useQuery<any>({
    queryKey: ["/api/mining/session", user?.id],
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute to stay synced
  });

  const { data: userData } = useQuery<any>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (miningSession?.endsAt && miningSession?.serverTime) {
      // Calculate time offset between server and client
      const serverNow = new Date(miningSession.serverTime).getTime();
      const clientNow = Date.now();
      const offset = serverNow - clientNow;
      setServerTimeOffset(offset);
      
      // Use the server's endsAt timestamp directly
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
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-amber-500">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-dashboard-username">
              {userData?.username || user?.username}
            </h2>
            {(userData?.phoneNumber || user?.phoneNumber) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground" data-testid="text-dashboard-phone">
                <Phone className="w-3 h-3" />
                {userData?.phoneNumber || user?.phoneNumber}
              </div>
            )}
          </div>
        </div>

        <StatsCards
          totalAssets={userData?.balance ?? user?.balance ?? 0}
          totalMiners={userData?.totalMiners ?? user?.totalMiners ?? 0}
        />

        <div className="flex justify-center py-8">
          <MiningButton
            isMining={isMining}
            endTime={miningEndTime}
            serverTimeOffset={serverTimeOffset}
            onStartMining={() => startMiningMutation.mutate()}
            onClaimReward={() => claimRewardMutation.mutate()}
            onTimerExpired={() => refetchSession()}
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
