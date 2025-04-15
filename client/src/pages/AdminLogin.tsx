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
      title="Key Management System" 
      subtitle="Sign in to access your account"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Username"
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Password"
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center justify-between">
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
                    />
                  </FormControl>
                  <Label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900 cursor-pointer"
                  >
                    Remember me
                  </Label>
                </FormItem>
              )}
            />

            <div className="text-sm">
              <Link href="#">
                <span className="font-medium text-primary hover:text-blue-700">
                  Forgot password?
                </span>
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isAdminLoginLoading}
            >
              {isAdminLoginLoading ? "Signing in..." : "Sign in as Admin"}
            </Button>
          </div>

          <div className="text-center">
            <Link href="/reseller/login">
              <span className="font-medium text-sm text-primary hover:text-blue-700">
                Login as Reseller instead
              </span>
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
