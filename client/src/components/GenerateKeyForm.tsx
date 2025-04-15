import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  game: z.string({
    required_error: "Please select a game",
  }),
  deviceLimit: z.string({
    required_error: "Please select a device limit",
  }),
  customKey: z.string().optional(),
  expiryDate: z.string({
    required_error: "Please select an expiry date",
  }).refine(date => {
    const selectedDate = new Date(date);
    const today = new Date();
    return selectedDate > today;
  }, {
    message: "Expiry date must be in the future",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function GenerateKeyForm() {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      game: "",
      deviceLimit: "",
      customKey: "",
      expiryDate: "",
    },
  });

  const generateKeyMutation = useMutation({
    mutationFn: async (data: {
      game: string;
      deviceLimit: number;
      customKey?: string;
      expiryDate: string;
    }) => {
      const res = await apiRequest('POST', '/api/reseller/generate-key', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/keys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Success",
        description: `Key ${data.key.key} generated successfully`,
      });
      form.reset({
        game: "",
        deviceLimit: "",
        customKey: "",
        expiryDate: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate key",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    generateKeyMutation.mutate({
      game: values.game,
      deviceLimit: parseInt(values.deviceLimit),
      customKey: values.customKey && values.customKey.trim() !== "" ? values.customKey : undefined,
      expiryDate: values.expiryDate,
    });
  };

  const minDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate New Key</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="game"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a game" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PUBG MOBILE">PUBG MOBILE</SelectItem>
                        <SelectItem value="LAST ISLAND OF SURVIVAL">LAST ISLAND OF SURVIVAL</SelectItem>
                        <SelectItem value="STANDOFF2">STANDOFF2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="deviceLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Limit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device limit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Device</SelectItem>
                        <SelectItem value="2">2 Devices</SelectItem>
                        <SelectItem value="100">100 Devices</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customKey"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Custom Key (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter custom key or leave blank for auto-generation"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={minDate()}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="sm:col-span-2"
                disabled={generateKeyMutation.isPending}
              >
                {generateKeyMutation.isPending ? "Generating..." : "Generate Key (Uses 1 Credit)"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
