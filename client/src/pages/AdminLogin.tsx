import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminLogin() {
  const { adminLogin, adminLoginError, isAdminLoginLoading } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Attempting admin login with:", data.username);
    adminLogin({
      username: data.username,
      password: data.password,
    });
  };

  // Use useEffect to display the toast for errors to prevent infinite rerenders
  useEffect(() => {
    if (adminLoginError) {
      toast({
        title: "Login failed",
        description: adminLoginError instanceof Error ? adminLoginError.message : "An error occurred",
        variant: "destructive",
      });
    }
  }, [adminLoginError, toast]);

  return (
    <AuthLayout 
      title="AsterialHack" 
      subtitle="Admin Portal | Game Authentication System"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-200">Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username"
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-t-md focus:ring-primary focus:border-primary"
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
                <FormItem className="mt-4">
                  <FormLabel className="text-sm font-medium text-gray-200">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-b-md focus:ring-primary focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center mt-6">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="remember-me"
                      className="text-primary border-gray-600"
                    />
                  </FormControl>
                  <Label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-300 cursor-pointer"
                  >
                    Remember me
                  </Label>
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
              disabled={isAdminLoginLoading}
            >
              {isAdminLoginLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                <span>Sign in as Admin</span>
              )}
            </Button>
          </div>

          <div className="text-center mt-6 border-t border-gray-700 pt-6">
            <Link href="/reseller/login">
              <span className="font-medium text-sm text-primary hover:text-primary/80 transition-colors">
                Login as Reseller instead
              </span>
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
