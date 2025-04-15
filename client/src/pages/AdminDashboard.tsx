import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { AdminNav } from "@/components/AdminNav";
import { ResellersTable } from "@/components/ResellersTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Key, CircleDollarSign, Check, X, Copy, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReferralToken {
  id: number;
  token: string;
  used: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [tokenCount, setTokenCount] = useState<string>("1");
  const { toast } = useToast();
  const [copiedToken, setCopiedToken] = useState<number | null>(null);

  // Add query for fetching tokens
  const { data: tokensData, isLoading: isTokensLoading, refetch: refetchTokens } = useQuery<{ 
    status: string, 
    tokens: ReferralToken[]
  }>({
    queryKey: ['/api/admin/tokens'],
  });

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
      
      // Refresh tokens list
      refetchTokens();
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

  const copyToClipboard = (id: number, token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      setCopiedToken(id);
      toast({
        title: "Copied to clipboard",
        description: "Token has been copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedToken(null);
      }, 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <AdminNav />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-100 bg-gradient-to-r from-violet-400 to-primary text-transparent bg-clip-text">Admin Dashboard</h2>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Statistics Cards */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gray-900 border-gray-800 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary rounded-md p-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-400 truncate">Total Resellers</div>
                    {isStatsLoading ? (
                      <div className="h-6 w-12 bg-gray-800 animate-pulse rounded" />
                    ) : (
                      <div className="text-lg font-medium text-gray-100">{statsData?.stats.totalResellers || 0}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary rounded-md p-3">
                    <Key className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-400 truncate">Total Keys</div>
                    {isStatsLoading ? (
                      <div className="h-6 w-12 bg-gray-800 animate-pulse rounded" />
                    ) : (
                      <div className="text-lg font-medium text-gray-100">{statsData?.stats.totalKeys || 0}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800 shadow-xl sm:col-span-2 lg:col-span-1">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary rounded-md p-3">
                    <CircleDollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-400 truncate">Total Credits Assigned</div>
                    {isStatsLoading ? (
                      <div className="h-6 w-12 bg-gray-800 animate-pulse rounded" />
                    ) : (
                      <div className="text-lg font-medium text-gray-100">{statsData?.stats.totalCredits || 0}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="tokens" className="mt-8">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-800">
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="resellers">Resellers</TabsTrigger>
            </TabsList>

            <TabsContent value="tokens" className="space-y-4">
              {/* Referral Token Generation */}
              <Card className="bg-gray-900 border-gray-800 shadow-xl">
                <CardContent className="pt-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-100">Generate Referral Tokens</h3>
                  <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-full sm:max-w-xs">
                      <label htmlFor="token-count" className="block text-sm font-medium text-gray-300">Number of Tokens</label>
                      <Select value={tokenCount} onValueChange={setTokenCount}>
                        <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-gray-200">
                          <SelectValue placeholder="Select token count" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="sm:mt-6 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white" 
                      onClick={handleGenerateTokens}
                      disabled={generateTokensMutation.isPending}
                    >
                      {generateTokensMutation.isPending ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </span>
                      ) : (
                        "Generate Tokens"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Token List */}
              <Card className="bg-gray-900 border-gray-800 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-100">Referral Tokens</h3>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-gray-300 border-gray-700 hover:bg-gray-800"
                      onClick={() => refetchTokens()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  
                  {isTokensLoading ? (
                    <div className="flex justify-center p-6">
                      <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : tokensData?.tokens && tokensData.tokens.length > 0 ? (
                    <ScrollArea className="h-[400px] rounded-md border border-gray-800">
                      <Table>
                        <TableHeader className="bg-gray-800">
                          <TableRow>
                            <TableHead className="w-[100px] text-gray-300">ID</TableHead>
                            <TableHead className="text-gray-300">Token</TableHead>
                            <TableHead className="w-[100px] text-gray-300">Status</TableHead>
                            <TableHead className="w-[100px] text-gray-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tokensData.tokens.map((token) => (
                            <TableRow key={token.id} className="border-gray-800 hover:bg-gray-800/50">
                              <TableCell className="font-medium text-gray-300">{token.id}</TableCell>
                              <TableCell className="font-mono text-sm text-gray-300">
                                <div className="flex items-center space-x-2">
                                  <span className="truncate max-w-[200px] sm:max-w-full">{token.token}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {token.used ? (
                                  <Badge variant="destructive" className="flex items-center justify-center gap-1 px-2">
                                    <X className="h-3 w-3" /> Used
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-1 px-2">
                                    <Check className="h-3 w-3" /> Available
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(token.id, token.token)}
                                  disabled={token.used}
                                  className={`${token.used ? 'text-gray-500' : 'text-gray-300 hover:text-primary'}`}
                                >
                                  {copiedToken === token.id ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No tokens found. Generate some tokens to get started.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resellers">
              {/* Reseller Management */}
              <Card className="bg-gray-900 border-gray-800 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-100 mb-4">Manage Resellers</h3>
                  <ResellersTable />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
