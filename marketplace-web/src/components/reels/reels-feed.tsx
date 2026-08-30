'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useReelsFeed, useRegisterReelView } from '@/hooks/use-reels';
import { Reel } from '@/lib/types';

function ShelfCard({ reel, onOpen }: { reel: Reel; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      onClick={onOpen}
      className="relative aspect-9/16 w-32 shrink-0 snap-start overflow-hidden rounded-lg bg-black sm:w-36"
    >
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl ?? undefined}
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-white">
        <p className="truncate text-xs font-medium">{reel.shop?.name}</p>
        {reel.caption && <p className="truncate text-[11px] text-white/80">{reel.caption}</p>}
      </div>
    </button>
  );
}

function ReelPlayer({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const registerView = useRegisterReelView();
  const hasCountedView = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
    if (!hasCountedView.current) {
      hasCountedView.current = true;
      registerView.mutate(reel.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel.id]);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl ?? undefined}
        loop
        playsInline
        controls
        className="h-full w-full object-contain"
      />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
        <p className="pointer-events-auto text-sm font-medium">{reel.shop?.name}</p>
        {reel.caption && <p className="pointer-events-auto mt-1 text-sm">{reel.caption}</p>}
        {reel.linkedProduct && (
          <Link
            href={`/product/${reel.linkedProduct.id}`}
            className="pointer-events-auto mt-2 inline-block rounded bg-white px-3 py-1 text-xs font-medium text-black"
          >
            Shop {reel.linkedProduct.title}
          </Link>
        )}
      </div>
    </div>
  );
}

function ReelModal({ reel, onClose }: { reel: Reel; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative aspect-9/16 h-[85vh] max-h-[700px] overflow-hidden rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <ReelPlayer reel={reel} />
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-sm text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ReelsFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useReelsFeed();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [openReel, setOpenReel] = useState<Reel | null>(null);

  function scrollByAmount(amount: number) {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  const reels = data?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-500">
        Loading reels...
      </div>
    );
  }

  if (reels.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Shorts</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => scrollByAmount(-300)} aria-label="Scroll left" className="text-lg text-gray-500 hover:text-gray-800">
            ‹
          </button>
          <button onClick={() => scrollByAmount(300)} aria-label="Scroll right" className="text-lg text-gray-500 hover:text-gray-800">
            ›
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="scrollbar-hide flex gap-2 overflow-x-auto scroll-smooth pb-2">
        {reels.map((reel) => (
          <ShelfCard key={reel.id} reel={reel} onOpen={() => setOpenReel(reel)} />
        ))}
        <div ref={sentinelRef} className="w-1 shrink-0" />
      </div>
      {openReel && <ReelModal reel={openReel} onClose={() => setOpenReel(null)} />}
    </div>
  );
}
