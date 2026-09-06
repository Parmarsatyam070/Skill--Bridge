import React from 'react';

interface BridgeObjectProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const BridgeObject: React.FC<BridgeObjectProps> = ({
  className = '',
  size = 'lg',
  showLabels = true,
}) => {
  const scale = size === 'sm' ? 0.6 : size === 'md' ? 0.8 : 1.0;

  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        width: `${520 * scale}px`,
        height: `${420 * scale}px`,
      }}
    >
      {/* Soft radial bloom glow behind the connector beam (single glowing gradient object) */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(47, 140, 130, 0.45) 0%, rgba(91, 127, 224, 0.25) 45%, transparent 70%)',
          animationDuration: '6s',
        }}
      />

      <svg
        className="relative z-10 w-full h-full overflow-visible transition-transform duration-700 ease-out"
        viewBox="0 0 520 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Bridge Gradient Definition: #2F8C82 to #5B7FE0 */}
          <linearGradient id="bridgeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#2F8C82" />
            <stop offset="100%" stopColor="#5B7FE0" />
          </linearGradient>

          <linearGradient id="academiaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A1D24" />
            <stop offset="100%" stopColor="#111318" />
          </linearGradient>

          <linearGradient id="industryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A1D24" />
            <stop offset="100%" stopColor="#111318" />
          </linearGradient>

          <linearGradient id="beamGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2F8C82" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#4CC38A" stopOpacity="1" />
            <stop offset="100%" stopColor="#5B7FE0" stopOpacity="0.9" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient grid base guides */}
        <g stroke="#2A2E38" strokeWidth="0.8" opacity="0.4">
          <line x1="60" y1="360" x2="460" y2="360" strokeDasharray="3 3" />
          <line x1="260" y1="120" x2="260" y2="380" strokeDasharray="2 4" />
        </g>

        {/* LEFT PLATFORM: Academia (Isometric faceted slab) */}
        <g className="transition-transform duration-500">
          {/* Top surface */}
          <polygon
            points="60,260 170,200 230,235 120,295"
            fill="url(#academiaGrad)"
            stroke="#2A2E38"
            strokeWidth="1.5"
          />
          {/* Left extrusion */}
          <polygon
            points="60,260 120,295 120,335 60,300"
            fill="#0E1015"
            stroke="#2A2E38"
            strokeWidth="1.5"
          />
          {/* Front extrusion */}
          <polygon
            points="120,295 230,235 230,275 120,335"
            fill="#14171E"
            stroke="#2A2E38"
            strokeWidth="1.5"
          />
          {/* Subtle teal accent edge indicating academic potential */}
          <line
            x1="170"
            y1="200"
            x2="230"
            y2="235"
            stroke="#2F8C82"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* RIGHT PLATFORM: Industry (Isometric faceted slab) */}
        <g className="transition-transform duration-500">
          {/* Top surface */}
          <polygon
            points="290,235 350,200 460,260 400,295"
            fill="url(#industryGrad)"
            stroke="#2A2E38"
            strokeWidth="1.5"
          />
          {/* Front extrusion */}
          <polygon
            points="290,235 400,295 400,335 290,275"
            fill="#14171E"
            stroke="#2A2E38"
            strokeWidth="1.5"
          />
          {/* Right extrusion */}
          <polygon
            points="400,295 460,260 460,300 400,335"
            fill="#0E1015"
            stroke="#2A2E38"
            strokeWidth="1.5"
          />
          {/* Subtle blue accent edge indicating industry demand */}
          <line
            x1="290"
            y1="235"
            x2="350"
            y2="200"
            stroke="#5B7FE0"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* THE LUMINOUS CONNECTOR BEAM: Where Academia & Industry meet */}
        <g filter="url(#softGlow)">
          {/* Ambient wide glow ribbon */}
          <path
            d="M 230 235 C 250 225, 270 225, 290 235"
            stroke="url(#bridgeGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.35"
          />
          {/* Intense core light beam */}
          <path
            d="M 230 235 C 250 225, 270 225, 290 235"
            stroke="url(#beamGlow)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Center Singularity: Node where verification locks */}
          <circle
            cx="260"
            y="229"
            r="4.5"
            fill="#F4F5F7"
            stroke="#2F8C82"
            strokeWidth="2"
          />
          <circle
            cx="260"
            y="229"
            r="8"
            fill="none"
            stroke="#4CC38A"
            strokeWidth="1"
            opacity="0.75"
          />
        </g>

        {/* Projected Light rays downward */}
        <path
          d="M 230 235 L 250 340 L 270 340 L 290 235 Z"
          fill="url(#bridgeGrad)"
          opacity="0.08"
        />

        {/* Optional small-caps platform labels */}
        {showLabels && (
          <>
            <text
              x="110"
              y="360"
              fill="#8B90A0"
              fontSize="10"
              fontFamily="Inter, sans-serif"
              fontWeight="500"
              letterSpacing="0.08em"
              textAnchor="middle"
            >
              ACADEMIA
            </text>
            <text
              x="260"
              y="195"
              fill="#4CC38A"
              fontSize="9"
              fontFamily="IBM Plex Mono, monospace"
              fontWeight="500"
              letterSpacing="0.1em"
              textAnchor="middle"
            >
              VERIFIED MATCH
            </text>
            <text
              x="410"
              y="360"
              fill="#8B90A0"
              fontSize="10"
              fontFamily="Inter, sans-serif"
              fontWeight="500"
              letterSpacing="0.08em"
              textAnchor="middle"
            >
              INDUSTRY
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

export default BridgeObject;
