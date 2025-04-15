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
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-800">
              <TableRow className="border-gray-800">
                <TableHead className="w-[150px] text-gray-300">Username</TableHead>
                <TableHead className="text-gray-300 hidden md:table-cell">Email</TableHead>
                <TableHead className="text-gray-300">Credits</TableHead>
                <TableHead className="text-gray-300 hidden sm:table-cell">Keys</TableHead>
                <TableHead className="text-right text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.resellers?.length === 0 ? (
                <TableRow className="border-gray-800">
                  <TableCell colSpan={5} className="text-center py-6 text-gray-400">
                    No resellers found
                  </TableCell>
                </TableRow>
              ) : (
                data?.resellers?.map((reseller) => (
                  <TableRow key={reseller.id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="font-medium text-gray-300">
                      <div>
                        {reseller.username}
                        <div className="text-xs text-gray-400 md:hidden">{reseller.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300 hidden md:table-cell">{reseller.email}</TableCell>
                    <TableCell className="text-gray-300">
                      <span className="font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md">
                        {reseller.credits}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-300 hidden sm:table-cell">{reseller.keysGenerated}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => handleOpenAddCreditsModal(reseller)}
                        >
                          Add Credits
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-gray-800">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-100">Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                This will permanently delete the reseller account and all their keys.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteReseller(reseller.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
