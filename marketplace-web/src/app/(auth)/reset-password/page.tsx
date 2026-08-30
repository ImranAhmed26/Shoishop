'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useResetPassword } from '@/hooks/use-auth';
import { resetPasswordSchema, firstFieldError } from '@/lib/validation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const resetPassword = useResetPassword();
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    const result = resetPasswordSchema.safeParse({ password });
    if (!result.success) {
      setValidationError(firstFieldError(result.error));
      return;
    }
    try {
      await resetPassword.mutateAsync({ token, password: result.data.password });
      router.push('/login');
    } catch {
      // error surfaced via resetPassword.isError below
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-gray-500">
        This reset link is missing its token. Please use the link from your email.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="password"
        required
        minLength={8}
        placeholder="New password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2"
      />
      {validationError && <p className="text-sm text-red-600">{validationError}</p>}
      {resetPassword.isError && (
        <p className="text-sm text-red-600">This reset link is invalid or has expired.</p>
      )}
      <button
        type="submit"
        disabled={resetPassword.isPending}
        className="rounded bg-orange-600 hover:bg-orange-700 px-3 py-2 text-white disabled:opacity-50"
      >
        {resetPassword.isPending ? 'Resetting...' : 'Reset password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Set a new password</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-4 text-sm">
        <Link href="/login" className="underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
