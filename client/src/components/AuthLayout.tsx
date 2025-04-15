import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black">
      <div className="max-w-md w-full space-y-4 bg-gray-900 p-8 rounded-lg shadow-xl border border-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-primary text-transparent bg-clip-text">{title}</h2>
          <p className="mt-2 text-gray-300 text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
