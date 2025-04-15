import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  amount: z.coerce.number().int().positive("Amount must be a positive number"),
});

type FormValues = z.infer<typeof formSchema>;

interface Reseller {
  id: number;
  username: string;
  email: string;
  credits: number;
}

interface AddCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reseller: Reseller;
}

export function AddCreditsModal({ isOpen, onClose, reseller }: AddCreditsModalProps) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 10,
    },
  });

  const addCreditsMutation = useMutation({
    mutationFn: async (data: { resellerId: number; amount: number }) => {
      const res = await apiRequest('POST', '/api/admin/add-credits', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resellers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: `Credits added to ${reseller.username}`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add credits",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    addCreditsMutation.mutate({
      resellerId: reseller.id,
      amount: data.amount,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border border-gray-800 text-gray-100 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-100 font-semibold">
            Add Credits to {reseller.username}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add credits to the reseller's account. Each credit can be used to generate one key.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700 mb-4">
              <div className="text-sm text-gray-300 mb-2">Current Credits</div>
              <div className="text-2xl font-bold text-primary">{reseller.credits}</div>
            </div>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Credit Amount to Add</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter credit amount"
                      min={1}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="w-full sm:w-auto border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addCreditsMutation.isPending}
                className="w-full sm:w-auto ml-0 sm:ml-3 bg-primary hover:bg-primary/90"
              >
                {addCreditsMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </div>
                ) : (
                  "Add Credits"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
