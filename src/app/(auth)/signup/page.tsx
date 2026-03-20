import { SignupForm } from "@/components/auth/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-xl p-8">
      <h2 className="text-xl font-bold text-text-primary mb-1">Create your account</h2>
      <p className="text-sm text-text-muted mb-6">Start saving links that matter</p>
      <SignupForm />
      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-purple hover:text-brand-purple-dark font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
