import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  referralToken: z.string().min(1, "Referral token is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function ResellerRegister() {
  const { resellerRegister, resellerRegisterError, isResellerRegisterLoading } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      referralToken: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    resellerRegister({
      username: data.username,
      email: data.email,
      password: data.password,
      referralToken: data.referralToken,
    });
  };

  // Use useEffect to display the toast for errors to prevent infinite rerenders
  useEffect(() => {
    if (resellerRegisterError) {
      toast({
        title: "Registration failed",
        description: resellerRegisterError instanceof Error ? resellerRegisterError.message : "An error occurred",
        variant: "destructive",
      });
    }
  }, [resellerRegisterError, toast]);

  return (
    <AuthLayout 
      title="AsterialHack" 
      subtitle="Reseller Registration | Game Authentication System"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-200">Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Choose a username"
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-md focus:ring-primary focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-200">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-md focus:ring-primary focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-200">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create a password"
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-md focus:ring-primary focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-200">Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-md focus:ring-primary focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referralToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-200">Referral Token</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your referral token"
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-md focus:ring-primary focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                  <p className="text-xs text-gray-400 mt-1">A referral token is required and can be obtained from an administrator.</p>
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
              disabled={isResellerRegisterLoading}
            >
              {isResellerRegisterLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </div>
              ) : (
                <span>Register as Reseller</span>
              )}
            </Button>
          </div>

          <div className="text-center mt-6 border-t border-gray-700 pt-6">
            <Link href="/reseller/login">
              <span className="font-medium text-sm text-primary hover:text-primary/80 transition-colors">
                Already have an account? Sign in
              </span>
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
