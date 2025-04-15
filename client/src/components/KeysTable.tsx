import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Copy, Trash2 } from "lucide-react";

interface Key {
  id: number;
  key: string;
  game: string;
  deviceLimit: number;
  devicesUsed: number;
  expiryDate: string;
  status: string;
}

export function KeysTable() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ status: string, keys: Key[] }>({
    queryKey: ['/api/reseller/keys'],
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      const res = await apiRequest('DELETE', `/api/reseller/keys/${keyId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/keys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/stats'] });
      toast({
        title: "Success",
        description: "Key has been deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete key",
        variant: "destructive",
      });
    },
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied",
      description: "Key copied to clipboard",
    });
  };

  const handleDeleteKey = (keyId: number) => {
    deleteKeyMutation.mutate(keyId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "full":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Full</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Game</TableHead>
            <TableHead>Device Limit</TableHead>
            <TableHead>Devices Used</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.keys?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                No keys generated yet
              </TableCell>
            </TableRow>
          ) : (
            data?.keys?.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.key}</TableCell>
                <TableCell>{key.game}</TableCell>
                <TableCell>{key.deviceLimit}</TableCell>
                <TableCell>{key.devicesUsed}</TableCell>
                <TableCell>{format(new Date(key.expiryDate), 'yyyy-MM-dd')}</TableCell>
                <TableCell>{getStatusBadge(key.status)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyKey(key.key)}
                    className="mr-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the key. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteKey(key.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
