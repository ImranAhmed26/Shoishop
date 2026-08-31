'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/use-auth';
import { forgotPasswordSchema, firstFieldError } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setValidationError(firstFieldError(result.error));
      return;
    }
    await forgotPassword.mutateAsync(result.data);
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Reset your password</h1>
      {forgotPassword.isSuccess ? (
        <p className="text-sm text-gray-500">
          If an account exists for that email, we&apos;ve sent a password reset link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
          {validationError && <p className="text-sm text-red-600">{validationError}</p>}
          <button
            type="submit"
            disabled={forgotPassword.isPending}
            className="rounded bg-brand-primary hover:bg-brand-primary-dark px-3 py-2 text-white disabled:opacity-50"
          >
            {forgotPassword.isPending ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm">
        <Link href="/login" className="underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
