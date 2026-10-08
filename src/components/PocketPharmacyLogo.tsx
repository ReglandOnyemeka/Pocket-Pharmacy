import React from "react";

interface PocketPharmacyLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
  tenantName?: string;
  tenantLocation?: string;
  showTenantSubtitle?: boolean;
  className?: string;
  showBrandName?: boolean;
  userName?: string;
}

export const PocketPharmacyLogo: React.FC<PocketPharmacyLogoProps> = ({
  size = "md",
  variant = "dark",
  tenantName,
  tenantLocation,
  showTenantSubtitle = true,
  className = "",
  showBrandName = true,
  userName
}) => {
  const isLight = variant === "light";

  const iconSizes = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 sm:w-11 sm:h-11 rounded-2xl",
    lg: "w-14 h-14 rounded-2xl"
  };

  const plusSizes = {
    sm: "w-5 h-5",
    md: "w-5.5 h-5.5 sm:w-6 sm:h-6",
    lg: "w-8 h-8"
  };

  const titleSizes = {
    sm: "text-sm sm:text-base",
    md: "text-base sm:text-lg md:text-xl",
    lg: "text-2xl sm:text-3xl"
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 select-none min-w-0 ${className}`}>
      {/* Authentic Original Pocket Pharmacy Rounded Plus Badge */}
      <div
        className={`${iconSizes[size]} shrink-0 bg-[#0a4738] border border-[#1b614f] shadow-md flex items-center justify-center relative overflow-hidden`}
      >
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
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          {showBrandName ? (
            <>
              <span
                className={`font-bold tracking-tight ${
                  isLight ? "text-[#0a4738]" : "text-white"
                } ${titleSizes[size]}`}
              >
                Pocket Pharmacy
              </span>

              {tenantName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#145a49] text-[#3be8b0] border border-[#3be8b0] uppercase tracking-wider shadow-xs truncate max-w-[140px] sm:max-w-none">
                  {tenantName}
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span
                title={tenantName || "Pharmacy"}
                className={`font-bold tracking-tight truncate ${
                  isLight ? "text-[#0a4738]" : "text-white"
                } ${titleSizes[size]} max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm`}
              >
                {tenantName || "Pharmacy"}
              </span>
            </div>
          )}
        </div>

        {showTenantSubtitle && (
          <p
            title={tenantLocation || (showBrandName ? "Pharmacy Operating Workspace" : "")}
            className={`text-[9.5px] sm:text-[11px] font-normal leading-tight truncate max-w-[125px] xs:max-w-[180px] sm:max-w-[250px] md:max-w-sm mt-0.5 ${
              isLight ? "text-slate-500" : "text-emerald-300"
            }`}
          >
            {tenantLocation ? tenantLocation : (showBrandName ? "PHARMACY OPERATING WORKSPACE" : "")}
          </p>
        )}
      </div>
    </div>
  );
};
