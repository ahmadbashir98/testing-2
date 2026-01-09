import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Flame,
  Copy,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { withdrawalFormSchema } from "@shared/schema";
import type { z } from "zod";

const PAYMENT_NUMBER = "03425809569";

type WithdrawFormData = z.infer<typeof withdrawalFormSchema>;

export default function Payments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["/api/withdrawals", user?.id],
    enabled: !!user?.id,
  });

  const form = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: {
      amount: 0,
      accountNumber: "",
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawFormData) => {
      const res = await apiRequest("POST", "/api/withdrawals/request", {
        userId: user?.id,
        ...data,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals", user?.id] });
      form.reset();
      toast({
        title: "Withdrawal requested!",
        description: "Your request is being processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal failed",
        description: error.message || "Could not process withdrawal",
        variant: "destructive",
      });
    },
  });

  const balance = userData?.balance ?? user?.balance ?? 0;

  const copyNumber = async () => {
    await navigator.clipboard.writeText(PAYMENT_NUMBER);
    setCopied(true);
    toast({ title: "Copied!", description: "Payment number copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-950/10 pb-20">
      <header className="flex items-center justify-center gap-2 py-4 border-b border-border/50">
        <Flame className="w-8 h-8 text-amber-400" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
          CloudFire
        </h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <Card className="border-green-500/20 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-green-400" />
              <CardTitle className="text-lg">Add Funds</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Smartphone className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  EasyPaisa / JazzCash
                </p>
                <p className="text-lg font-bold text-foreground">{PAYMENT_NUMBER}</p>
              </div>
            </div>

            <Button
              onClick={copyNumber}
              variant="outline"
              className="w-full gap-2"
              data-testid="button-copy-number"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy Number"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Send payment to this number and contact support with your receipt
              to add funds to your account.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-lg">Withdraw</CardTitle>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-lg font-bold text-amber-400" data-testid="text-withdraw-balance">
                  {balance.toLocaleString()} PKR
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  withdrawMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (PKR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          className="bg-background/50"
                          data-testid="input-withdraw-amount"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="EasyPaisa/JazzCash number"
                          className="bg-background/50"
                          data-testid="input-account-number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={withdrawMutation.isPending || balance < 500}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  data-testid="button-withdraw"
                >
                  {withdrawMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Request Withdrawal"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Minimum withdrawal: 500 PKR
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>

        {withdrawals.length > 0 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {withdrawals.slice(0, 5).map((w: any) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                    data-testid={`withdrawal-${w.id}`}
                  >
                    <div>
                      <p className="font-medium">
                        {w.amount.toLocaleString()} PKR
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`
                        px-2 py-1 text-xs rounded-full
                        ${
                          w.status === "pending"
                            ? "bg-amber-500/20 text-amber-400"
                            : w.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }
                      `}
                    >
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
