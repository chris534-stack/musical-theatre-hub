import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" aria-label="Our Stage, Eugene Home">
      <svg
        viewBox="0 0 200 200"
        className="h-16 w-auto text-primary"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="currentColor" strokeWidth="4">
            <path
              d="M175 180 C 210 100, 160 20, 100 20 C 40 20, -10 100, 25 180 C 50 220, 150 220, 175 180 Z"
            />
            <path d="M162 175 C 190 105, 150 40, 100 40 C 50 40, 10 105, 38 175" strokeLinecap="round"/>

            {/* segments */}
            <path d="M100 20 L 100 40" />
            <path d="M128 25 L 124 44" />
            <path d="M72 25 L 76 44" />
            <path d="M150 55 L 142 68" />
            <path d="M50 55 L 58 68" />
            <path d="M163 90 L 155 100" />
            <path d="M37 90 L 45 100" />

            {/* Curtains */}
            <path d="M38 175 C 50 140, 50 90, 45 60"/>
            <path d="M32 175 C 44 140, 44 90, 39 60"/>
            <path d="M162 175 C 150 140, 150 90, 155 60"/>
            <path d="M168 175 C 156 140, 156 90, 161 60"/>
        </g>
        
        <text
          x="50%"
          y="45%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="currentColor"
          className="font-headline"
          style={{ fontSize: '32px' }}
        >
          OUR
        </text>
        <text
          x="50%"
          y="60%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="currentColor"
          className="font-headline"
          style={{ fontSize: '32px' }}
        >
          STAGE
        </text>
        <text
          x="50%"
          y="75%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="currentColor"
          className="font-body tracking-widest"
          style={{ fontSize: '20px', fontWeight: 'bold' }}
        >
          EUGENE
        </text>
      </svg>
    </Link>
  );
}
