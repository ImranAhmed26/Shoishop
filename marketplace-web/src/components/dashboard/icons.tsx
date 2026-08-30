interface IconProps {
  className?: string;
}

function base(children: React.ReactNode, className?: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? 'h-5 w-5'}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconGrid({ className }: IconProps) {
  return base(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>,
    className,
  );
}

export function IconBox({ className }: IconProps) {
  return base(
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </>,
    className,
  );
}

export function IconReceipt({ className }: IconProps) {
  return base(
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </>,
    className,
  );
}

export function IconFilm({ className }: IconProps) {
  return base(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>,
    className,
  );
}

export function IconTag({ className }: IconProps) {
  return base(
    <>
      <path d="M12 3h6a2 2 0 0 1 2 2v6l-9 9-8-8 9-9Z" />
      <circle cx="15" cy="9" r="1.25" fill="currentColor" stroke="none" />
    </>,
    className,
  );
}

export function IconAward({ className }: IconProps) {
  return base(
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="M9 12.5 7.5 21l4.5-2.5 4.5 2.5-1.5-8.5" />
    </>,
    className,
  );
}

export function IconStore({ className }: IconProps) {
  return base(
    <>
      <path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3" />
      <path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3 2v0" />
      <path d="M5 11v9h14v-9" />
      <path d="M10 20v-5h4v5" />
    </>,
    className,
  );
}

export function IconChart({ className }: IconProps) {
  return base(
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-5 3 3 5-7" />
    </>,
    className,
  );
}

export function IconLogout({ className }: IconProps) {
  return base(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>,
    className,
  );
}
