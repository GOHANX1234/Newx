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
import { AddCreditsModal } from "@/components/AddCreditsModal";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Reseller {
  id: number;
  username: string;
  email: string;
  credits: number;
  keysGenerated: number;
}

export function ResellersTable() {
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ status: string, resellers: Reseller[] }>({
    queryKey: ['/api/admin/resellers'],
  });

  const deleteResellerMutation = useMutation({
    mutationFn: async (resellerId: number) => {
      const res = await apiRequest('DELETE', `/api/admin/resellers/${resellerId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resellers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "Reseller has been deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete reseller",
        variant: "destructive",
      });
    },
  });

  const handleOpenAddCreditsModal = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setIsAddCreditsModalOpen(true);
  };

  const handleCloseAddCreditsModal = () => {
    setIsAddCreditsModalOpen(false);
    setSelectedReseller(null);
  };

  const handleDeleteReseller = (resellerId: number) => {
    deleteResellerMutation.mutate(resellerId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Keys Generated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.resellers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  No resellers found
                </TableCell>
              </TableRow>
            ) : (
              data?.resellers?.map((reseller) => (
                <TableRow key={reseller.id}>
                  <TableCell className="font-medium">{reseller.username}</TableCell>
                  <TableCell>{reseller.email}</TableCell>
                  <TableCell>{reseller.credits}</TableCell>
                  <TableCell>{reseller.keysGenerated}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="link"
                      className="text-primary hover:text-blue-700 mr-3"
                      onClick={() => handleOpenAddCreditsModal(reseller)}
                    >
                      Add Credits
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="link"
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the reseller account and all their keys.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteReseller(reseller.id)}
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
      
      {selectedReseller && (
        <AddCreditsModal
          isOpen={isAddCreditsModalOpen}
          onClose={handleCloseAddCreditsModal}
          reseller={selectedReseller}
        />
      )}
    </>
  );
}
