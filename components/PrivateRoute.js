"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  const publicRoutes = ["/register"];

  useEffect(() => {
    if (!user && !publicRoutes.includes(router.pathname)) {
      router.push("/");
    }
  }, [user, router.pathname]);

  return user || publicRoutes.includes(router.pathname) ? children : null;
};

export default PrivateRoute;
