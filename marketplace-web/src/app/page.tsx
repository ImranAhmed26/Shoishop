import { ReelsFeed } from '@/components/reels/reels-feed';

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <ReelsFeed />
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <p className="mt-2 text-sm text-gray-500">
          The product grid lands here in a later step.
        </p>
      </div>
    </div>
  );
}
