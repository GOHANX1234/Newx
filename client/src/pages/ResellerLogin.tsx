import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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

export default function ResellerLogin() {
  const { resellerLogin, resellerLoginError, isResellerLoginLoading } = useAuth();
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
    resellerLogin({
      username: data.username,
      password: data.password,
    });
  };

  if (resellerLoginError) {
    toast({
      title: "Login failed",
      description: resellerLoginError instanceof Error ? resellerLoginError.message : "An error occurred",
      variant: "destructive",
    });
  }

  return (
    <AuthLayout 
      title="Key Management System" 
      subtitle="Sign in to access your reseller account"
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

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              disabled={isResellerLoginLoading}
            >
              {isResellerLoginLoading ? "Signing in..." : "Sign in as Reseller"}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <Link href="/">
              <span className="font-medium text-sm text-secondary hover:text-indigo-700">
                Login as Admin instead
              </span>
            </Link>
            <div className="block pt-2">
              <Link href="/reseller/register">
                <span className="font-medium text-sm text-secondary hover:text-indigo-700">
                  Don't have an account? Register
                </span>
              </Link>
            </div>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
