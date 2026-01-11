import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Users, Copy, Check, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface ReferralMember {
  id: string;
  username: string;
  createdAt: string;
  commissionEarned: number;
}

export default function Team() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { data: userData } = useQuery<any>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<{
    level1: ReferralMember[];
    level2: ReferralMember[];
  }>({
    queryKey: ["/api/referrals", user?.id],
    enabled: !!user?.id,
  });

  const referralCode = userData?.referralCode || user?.referralCode || "";
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast({ title: "Copied!", description: "Invitation code copied to clipboard" });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const totalReferralEarnings = parseFloat(String(userData?.totalReferralEarnings || 0));
  const level1Count = referrals?.level1?.length || 0;
  const level2Count = referrals?.level2?.length || 0;
  const totalTeamSize = level1Count + level2Count;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return format(date, "MMM d, yyyy");
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-950/10 pb-20">
      <header className="flex items-center justify-center gap-2 py-4 border-b border-border/50">
        <Flame className="w-8 h-8 text-amber-400" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
          CloudFire
        </h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <div className="rounded-xl overflow-hidden" data-testid="section-team-dashboard">
          <div className="bg-white p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">My Team</h2>
                <p className="text-sm text-gray-500">Invite friends and earn commissions</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-700" data-testid="text-total-team-size">
                    {totalTeamSize}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">Total Team Size</div>
                  <div className="text-xs text-gray-500 mt-1">L1: {level1Count} | L2: {level2Count}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-amber-700" data-testid="text-total-team-commission">
                    ${totalReferralEarnings.toFixed(2)}
                  </div>
                  <div className="text-sm text-amber-600 font-medium">Total Commission</div>
                  <div className="text-xs text-gray-500 mt-1">From team earnings</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Your Referral Link
              </h3>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <code className="flex-1 text-xs truncate text-blue-600" data-testid="text-referral-link">
                  {referralLink}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={copyLink}
                  data-testid="button-copy-referral"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-xs text-gray-500">Invitation Code</span>
                  <div className="font-mono font-bold text-gray-900 text-lg" data-testid="text-invitation-code">
                    {referralCode}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-200 text-amber-600 hover:bg-amber-50"
                  onClick={copyCode}
                  data-testid="button-copy-code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-semibold text-blue-800 mb-2">Commission Rates</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded p-2 text-center border border-blue-100">
                  <span className="text-2xl font-bold text-green-600">10%</span>
                  <p className="text-xs text-gray-600">Level 1 (Direct)</p>
                </div>
                <div className="bg-white rounded p-2 text-center border border-blue-100">
                  <span className="text-2xl font-bold text-blue-600">4%</span>
                  <p className="text-xs text-gray-600">Level 2 (Indirect)</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="level1" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger 
                  value="level1" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  data-testid="tab-level1"
                >
                  Level 1 ({level1Count})
                </TabsTrigger>
                <TabsTrigger 
                  value="level2" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  data-testid="tab-level2"
                >
                  Level 2 ({level2Count})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="level1" className="mt-3">
                {referralsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : level1Count === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No Level 1 members yet</p>
                    <p className="text-sm">Share your link to start earning!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {referrals?.level1?.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                        data-testid={`member-level1-${member.id}`}
                      >
                        <div>
                          <div className="font-medium text-gray-900">{member.username}</div>
                          <div className="text-xs text-gray-500">
                            Joined: {formatDate(member.createdAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            +${member.commissionEarned?.toFixed(2) || "0.00"}
                          </div>
                          <div className="text-xs text-gray-500">Commission</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="level2" className="mt-3">
                {referralsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : level2Count === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No Level 2 members yet</p>
                    <p className="text-sm">Level 2 members are referrals of your Level 1 members</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {referrals?.level2?.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                        data-testid={`member-level2-${member.id}`}
                      >
                        <div>
                          <div className="font-medium text-gray-900">{member.username}</div>
                          <div className="text-xs text-gray-500">
                            Joined: {formatDate(member.createdAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            +${member.commissionEarned?.toFixed(2) || "0.00"}
                          </div>
                          <div className="text-xs text-gray-500">Commission</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
