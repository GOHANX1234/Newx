import { useQuery } from "@tanstack/react-query";
import { ResellerNav } from "@/components/ResellerNav";
import { GenerateKeyForm } from "@/components/GenerateKeyForm";
import { KeysTable } from "@/components/KeysTable";
import { APIDocumentation } from "@/components/APIDocumentation";
import { Card, CardContent } from "@/components/ui/card";
import { Key, CheckCircle, XCircle } from "lucide-react";

export default function ResellerDashboard() {
  const { data: statsData, isLoading: isStatsLoading } = useQuery<{
    status: string,
    stats: {
      totalKeys: number,
      activeKeys: number,
      expiredKeys: number,
    }
  }>({
    queryKey: ['/api/reseller/stats'],
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <ResellerNav />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-800">Reseller Dashboard</h2>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Statistics Cards */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-secondary rounded-md p-3">
                    <Key className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 truncate">Total Keys Generated</div>
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
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 truncate">Active Keys</div>
                    {isStatsLoading ? (
                      <div className="h-6 w-12 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <div className="text-lg font-medium text-gray-900">{statsData?.stats.activeKeys || 0}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 truncate">Expired Keys</div>
                    {isStatsLoading ? (
                      <div className="h-6 w-12 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <div className="text-lg font-medium text-gray-900">{statsData?.stats.expiredKeys || 0}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Generation Form */}
          <div className="mt-8">
            <GenerateKeyForm />
          </div>

          {/* Key Management */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Manage Keys</h3>
              <KeysTable />
            </CardContent>
          </Card>
          
          {/* API Documentation */}
          <div className="mt-8">
            <APIDocumentation />
          </div>
        </div>
      </div>
    </div>
  );
}
