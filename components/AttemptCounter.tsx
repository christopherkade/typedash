interface Props {
  current: number;
  max: number;
}

export default function AttemptCounter({ current, max }: Props) {
  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 text-white/25 text-xs tracking-[0.35em] uppercase font-mono select-none">
      Attempt {current} / {max}
    </div>
  );
}
