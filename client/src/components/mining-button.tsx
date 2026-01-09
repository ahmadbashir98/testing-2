import { useState, useEffect } from "react";
import { Zap, Loader2 } from "lucide-react";

interface MiningButtonProps {
  isMining: boolean;
  endTime: Date | null;
  onStartMining: () => void;
  onClaimReward: () => void;
  isLoading: boolean;
}

export function MiningButton({
  isMining,
  endTime,
  onStartMining,
  onClaimReward,
  isLoading,
}: MiningButtonProps) {
  const [timeLeft, setTimeLeft] = useState<string>("24:00:00");
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    if (!isMining || !endTime) {
      setTimeLeft("24:00:00");
      setCanClaim(false);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setCanClaim(true);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
      setCanClaim(false);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining, endTime]);

  const handleClick = () => {
    if (isLoading) return;
    if (canClaim) {
      onClaimReward();
    } else if (!isMining) {
      onStartMining();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={handleClick}
        disabled={isLoading || (isMining && !canClaim)}
        className={`
          relative w-48 h-48 md:w-56 md:h-56 rounded-full
          flex flex-col items-center justify-center gap-2
          transition-all duration-300 transform
          ${
            isMining && !canClaim
              ? "bg-gradient-to-br from-blue-600 to-blue-800 cursor-not-allowed"
              : canClaim
              ? "bg-gradient-to-br from-amber-500 to-amber-700 hover:scale-105 active:scale-95 cursor-pointer"
              : "bg-gradient-to-br from-blue-500 to-amber-500 hover:scale-105 active:scale-95 cursor-pointer"
          }
          ${!isLoading && !isMining ? "animate-pulse-glow" : ""}
          shadow-2xl
        `}
        data-testid="button-mining"
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/20" />
        <div className="absolute inset-4 rounded-full border border-white/10" />
        
        {isLoading ? (
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        ) : (
          <>
            <Zap className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg" />
            <span className="text-lg md:text-xl font-bold text-white drop-shadow-lg">
              {canClaim ? "CLAIM" : isMining ? "MINING..." : "START MINING"}
            </span>
          </>
        )}
      </button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">
          {isMining ? (canClaim ? "Ready to claim!" : "Mining in progress") : "Start your mining session"}
        </p>
        <p className="text-3xl md:text-4xl font-bold text-amber-400 tabular-nums tracking-wider">
          {timeLeft}
        </p>
      </div>
    </div>
  );
}
