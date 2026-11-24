import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onSyncNow?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  pendingCount,
  isSyncing,
  onSyncNow
}) => {
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="bg-amber-600 text-white border-b border-amber-700 px-3 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Offline Mode — POS, Inventory & Records work locally and will sync automatically when you reconnect.
            </span>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-800 text-white font-mono text-[11px] shrink-0">
              {pendingCount} queued
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#063327] text-[#3be8b0] border-b border-[#145a49] px-3 sm:px-6 py-1.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? "animate-spin" : ""}`} />
          <span>
            {isSyncing
              ? `Syncing ${pendingCount || ""} offline change${pendingCount === 1 ? "" : "s"} to cloud...`
              : `${pendingCount} offline change${pendingCount === 1 ? "" : "s"} waiting to sync.`}
          </span>
        </div>
        {!isSyncing && onSyncNow && (
          <button
            type="button"
            onClick={onSyncNow}
            className="px-2.5 py-0.5 rounded-md bg-[#145a49] hover:bg-[#1b6b57] text-white border border-[#3be8b0] text-[11px] font-bold cursor-pointer"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  );
};
