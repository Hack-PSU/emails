import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFirebase } from "@/common/context/FirebaseProvider";
import { Skeleton } from "@/components/ui/skeleton";

type AuthGuardProps = {
  children: React.ReactNode;
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthenticated } = useFirebase();

  useEffect(() => {
    if (pathname !== "/login" && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [pathname, isLoading, isAuthenticated, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex flex-col space-y-2 p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
