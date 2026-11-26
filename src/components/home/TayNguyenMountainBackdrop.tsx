export function TayNguyenMountainBackdrop({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
    >
      {/* Warm highland sky glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(232,208,170,0.28)_0%,rgba(250,246,241,0)_68%)]" />

      {/* Stylized multi-layer Tây Nguyên mountain ridges & forest silhouettes */}
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Distant highland sun */}
        <circle cx="960" cy="78" r="28" fill="#D5A64A" fillOpacity="0.14" />

        {/* Far ridge */}
        <path
          d="M0 240 L180 175 L340 205 L520 138 L710 185 L900 120 L1100 172 L1280 132 L1440 168 L1440 320 L0 320 Z"
          fill="#6C7D68"
          fillOpacity="0.09"
        />

        {/* Mid ridge */}
        <path
          d="M0 262 L140 218 L290 238 L470 182 L660 226 L860 166 L1040 212 L1230 178 L1440 220 L1440 320 L0 320 Z"
          fill="#4A5B47"
          fillOpacity="0.09"
        />

        {/* Foreground subtle forest ridge */}
        <path
          d="M0 286 L210 250 L390 272 L580 238 L790 268 L990 232 L1200 264 L1440 242 L1440 320 L0 320 Z"
          fill="#374435"
          fillOpacity="0.07"
        />
      </svg>

      {/* Gentle drifting highland mist layers */}
      <div className="taynguyen-mist-1 absolute -inset-x-[10%] bottom-[18%] h-[42%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,246,241,0.88)_0%,rgba(250,246,241,0.35)_52%,transparent_80%)] blur-[22px] will-change-transform" />
      <div className="taynguyen-mist-2 absolute -inset-x-[8%] bottom-[4%] h-[36%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,246,241,0.92)_0%,rgba(250,246,241,0.4)_55%,transparent_82%)] blur-[26px] will-change-transform" />

      {/* Soft cream edge fade into section background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(250,246,241,0.92)_0%,transparent_22%,transparent_72%,rgba(250,246,241,1)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(250,246,241,0.95)_0%,transparent_14%,transparent_86%,rgba(250,246,241,0.95)_100%)]" />
    </div>
  );
}

