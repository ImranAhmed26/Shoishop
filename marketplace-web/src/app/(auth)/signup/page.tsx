'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignup } from '@/hooks/use-auth';
import { signupSchema, firstFieldError } from '@/lib/validation';

export default function SignupPage() {
  const router = useRouter();
  const signup = useSignup();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'BUYER' | 'SHOP_OWNER'>('BUYER');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    const result = signupSchema.safeParse({ name, email, password, role });
    if (!result.success) {
      setValidationError(firstFieldError(result.error));
      return;
    }
    try {
      await signup.mutateAsync(result.data);
      router.push('/');
    } catch {
      // error surfaced via signup.isError below
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Sign up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-transparent"
        />
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
          minLength={8}
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-transparent"
        />
        <fieldset className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={role === 'BUYER'}
              onChange={() => setRole('BUYER')}
            />
            I&apos;m shopping
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={role === 'SHOP_OWNER'}
              onChange={() => setRole('SHOP_OWNER')}
            />
            I want to sell
          </label>
        </fieldset>
        {validationError && <p className="text-sm text-red-600">{validationError}</p>}
        {signup.isError && (
          <p className="text-sm text-red-600">
            Could not sign up. That email may already be registered.
          </p>
        )}
        <button
          type="submit"
          disabled={signup.isPending}
          className="rounded bg-orange-600 hover:bg-orange-700 px-3 py-2 text-white disabled:opacity-50"
        >
          {signup.isPending ? 'Signing up...' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
