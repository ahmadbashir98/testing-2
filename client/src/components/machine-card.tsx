import { Lock, TrendingUp, Cpu } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MiningMachine } from "@shared/schema";

interface MachineCardProps {
  machine: MiningMachine;
  canAfford: boolean;
  owned: number;
  onRent: () => void;
  isLoading: boolean;
}

export function MachineCard({
  machine,
  canAfford,
  owned,
  onRent,
  isLoading,
}: MachineCardProps) {
  const isHighTier = machine.level >= 8;
  const isMidTier = machine.level >= 4 && machine.level < 8;

  return (
    <Card
      className={`
        p-4 transition-all duration-200
        ${
          isHighTier
            ? "border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-500/10 to-transparent"
            : isMidTier
            ? "border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-500/5 to-transparent"
            : "border-l-4 border-l-blue-600"
        }
        ${canAfford ? "hover-elevate" : "opacity-60"}
      `}
      data-testid={`card-machine-${machine.id}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`
            w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center
            ${
              isHighTier
                ? "bg-gradient-to-br from-amber-500 to-amber-700"
                : isMidTier
                ? "bg-gradient-to-br from-blue-400 to-amber-500"
                : "bg-gradient-to-br from-blue-500 to-blue-700"
            }
          `}
        >
          <Cpu
            className={`w-6 h-6 md:w-7 md:h-7 text-white ${
              isHighTier ? "animate-spin-slow" : ""
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{machine.name}</h3>
            {owned > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                x{owned} owned
              </span>
            )}
          </div>
          <p className="text-foreground font-semibold">
            {machine.price.toLocaleString()} PKR
          </p>
          <div className="flex items-center gap-1 text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              +{machine.dailyProfit} PKR/day
            </span>
          </div>
        </div>

        <div className="flex-shrink-0">
          {canAfford ? (
            <Button
              onClick={onRent}
              disabled={isLoading}
              className={`
                min-w-[80px]
                ${
                  isHighTier
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                }
              `}
              data-testid={`button-rent-${machine.id}`}
            >
              Rent
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span className="text-sm">Locked</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
