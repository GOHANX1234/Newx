import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = (await res.text()) || res.statusText;
      const errorMessage = `${res.status}: ${text}`;
      console.error(`API Error: ${errorMessage}`);
      throw new Error(errorMessage);
    } catch (error) {
      console.error(`Failed to parse error response: ${error}`);
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`, data || '');
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    console.log(`API Response for ${url}: Status ${res.status} ${res.statusText}`);
    
    // Allow 401 responses to be handled by the caller
    if (res.status === 401) {
      console.warn(`Authentication error (401) for ${url}`);
      return res;
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Request failed for ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`QueryFn: Fetching ${url}`);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });
      
      console.log(`QueryFn: ${url} response status: ${res.status}`);
      
      if (res.status === 401) {
        console.warn(`QueryFn: Authentication error (401) for ${url}`);
        if (unauthorizedBehavior === "returnNull") {
          console.log(`QueryFn: Returning null for 401 response as configured`);
          return null;
        }
      }
      
      await throwIfResNotOk(res);
      
      const data = await res.json();
      console.log(`QueryFn: Successful response for ${url}:`, data);
      return data;
    } catch (error) {
      console.error(`QueryFn: Error fetching ${url}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Return null on 401 instead of throwing
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - default stale time
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
