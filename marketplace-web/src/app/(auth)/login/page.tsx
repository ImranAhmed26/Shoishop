'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLogin } from '@/hooks/use-auth';
import { loginSchema, firstFieldError } from '@/lib/validation';
import { API_URL } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setValidationError(firstFieldError(result.error));
      return;
    }
    try {
      await login.mutateAsync(result.data);
      router.push('/');
    } catch {
      // error surfaced via login.isError below
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-transparent"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-transparent"
        />
        {validationError && <p className="text-sm text-red-600">{validationError}</p>}
        {login.isError && (
          <p className="text-sm text-red-600">Invalid email or password.</p>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          className="rounded bg-brand-primary hover:bg-brand-primary-dark px-3 py-2 text-white disabled:opacity-50"
        >
          {login.isPending ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="mt-2 text-right text-sm">
        <Link href="/forgot-password" className="text-gray-500 underline">
          Forgot password?
        </Link>
      </p>
      <a
        href={`${API_URL}/auth/google`}
        className="mt-4 flex items-center justify-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
      >
        Continue with Google
      </a>
      <p className="mt-4 text-sm">
        No account?{' '}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
