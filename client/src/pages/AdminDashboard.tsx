import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { AdminNav } from "@/components/AdminNav";
import { ResellersTable } from "@/components/ResellersTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Key, CircleDollarSign } from "lucide-react";

export default function AdminDashboard() {
  const [tokenCount, setTokenCount] = useState<string>("1");
  const { toast } = useToast();

  const { data: statsData, isLoading: isStatsLoading } = useQuery<{ 
    status: string, 
    stats: { 
      totalResellers: number, 
      totalKeys: number, 
      totalCredits: number 
    } 
  }>({
    queryKey: ['/api/admin/stats'],
  });

  const generateTokensMutation = useMutation({
    mutationFn: async (count: number) => {
      const res = await apiRequest('POST', '/api/admin/generate-tokens', { count });
      return res.json();
    },
    onSuccess: (data) => {
      let message: string;
      if (data.tokens.length === 1) {
        message = `Token generated: ${data.tokens[0].token}`;
      } else {
        message = `${data.tokens.length} tokens generated successfully`;
      }
      
      toast({
        title: "Success",
        description: message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate tokens",
        variant: "destructive",
      });
    },
  });

  const handleGenerateTokens = () => {
    generateTokensMutation.mutate(parseInt(tokenCount));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h2>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Statistics Cards */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary rounded-md p-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 truncate">Total Resellers</div>
                    {isStatsLoading ? (
                      <div className="h-6 w-12 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <div className="text-lg font-medium text-gray-900">{statsData?.stats.totalResellers || 0}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-secondary rounded-md p-3">
                    <Key className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 truncate">Total Keys</div>
                    {isStatsLoading ? (
                      <div className="h-6 w-12 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <div className="text-lg font-medium text-gray-900">{statsData?.stats.totalKeys || 0}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-accent rounded-md p-3">
                    <CircleDollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 truncate">Total Credits Assigned</div>
                    {isStatsLoading ? (
                      <div className="h-6 w-12 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <div className="text-lg font-medium text-gray-900">{statsData?.stats.totalCredits || 0}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Token Generation */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Generate Referral Token</h3>
              <div className="mt-5 flex items-center">
                <div className="max-w-xs w-full">
                  <label htmlFor="token-count" className="block text-sm font-medium text-gray-700">Number of Tokens</label>
                  <Select value={tokenCount} onValueChange={setTokenCount}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select token count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="ml-4 mt-6" 
                  onClick={handleGenerateTokens}
                  disabled={generateTokensMutation.isPending}
                >
                  {generateTokensMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reseller Management */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Manage Resellers</h3>
              <ResellersTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
