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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Credits to {reseller.username}</DialogTitle>
          <DialogDescription>
            Add credits to the reseller's account. Each credit can be used to generate one key.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter credit amount"
                      min={1}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="mt-3"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addCreditsMutation.isPending}
                className="ml-3"
              >
                {addCreditsMutation.isPending ? "Adding..." : "Add Credits"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
