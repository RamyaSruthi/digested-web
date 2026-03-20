import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div className="bg-surface rounded-xl border border-border p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Reset your password
      </h2>
      <p className="text-sm text-text-muted mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <ResetPasswordForm />
      <p className="text-center text-sm text-text-muted mt-6">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-brand-purple hover:text-brand-purple-dark font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
