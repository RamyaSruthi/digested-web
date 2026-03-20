import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-xl p-8">
      <h2 className="text-xl font-bold text-text-primary mb-1">Welcome back</h2>
      <p className="text-sm text-text-muted mb-6">Sign in to your account</p>
      <LoginForm />
      <p className="text-center text-sm text-text-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brand-purple hover:text-brand-purple-dark font-semibold">
          Sign up
        </Link>
      </p>
      <p className="text-center mt-2">
        <Link href="/reset-password" className="text-xs text-text-muted hover:text-text-secondary">
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
