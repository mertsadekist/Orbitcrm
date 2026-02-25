import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | OrbitFlow CRM",
  description: "Sign in to your OrbitFlow CRM account",
};

export default function LoginPage() {
  return <LoginForm />;
}
