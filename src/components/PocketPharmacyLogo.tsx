import React from "react";

interface PocketPharmacyLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
  tenantName?: string;
  tenantLocation?: string;
  showTenantSubtitle?: boolean;
  className?: string;
}

export const PocketPharmacyLogo: React.FC<PocketPharmacyLogoProps> = ({
  size = "md",
  variant = "dark",
  tenantName,
  tenantLocation,
  showTenantSubtitle = true,
  className = ""
}) => {
  const isLight = variant === "light";

  const iconSizes = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-11 h-11 rounded-2xl",
    lg: "w-14 h-14 rounded-2xl"
  };

  const plusSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const titleSizes = {
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-2xl sm:text-3xl"
  };

  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {/* Authentic Original Pocket Pharmacy Rounded Plus Badge */}
      <div
        className={`${iconSizes[size]} shrink-0 bg-[#0a4738] border border-[#1b614f]/80 shadow-md flex items-center justify-center relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3be8b0"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${plusSizes[size]} drop-shadow-[0_0_8px_rgba(59,232,176,0.5)]`}
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </div>

      {/* Brand & Tenant Labeling */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-bold tracking-tight ${
              isLight ? "text-[#0a4738]" : "text-white"
            } ${titleSizes[size]}`}
          >
            Pocket Pharmacy
          </span>

          {tenantName && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#145a49] text-[#3be8b0] border border-[#3be8b0]/30 uppercase tracking-wider shadow-xs">
              {tenantName}
            </span>
          )}
        </div>

        {showTenantSubtitle && (
          <p
            className={`text-xs font-mono tracking-wider uppercase font-medium leading-tight truncate max-w-[220px] sm:max-w-md mt-0.5 ${
              isLight ? "text-slate-500" : "text-[#6ee7b7]"
            }`}
          >
            {tenantName ? (
              <span className="flex items-center gap-1.5">
                <span>{tenantName}</span>
                {tenantLocation && <span className="opacity-80 font-sans">• {tenantLocation}</span>}
              </span>
            ) : (
              "POS & STOCK MANAGER"
            )}
          </p>
        )}
      </div>
    </div>
  );
};
