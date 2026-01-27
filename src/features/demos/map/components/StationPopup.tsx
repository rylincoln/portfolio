import { getCategoryColor, normalizeCategory } from '../utils/aqi'
import type { DisplayStation } from '../types'

interface StationPopupProps {
  station: DisplayStation
  onViewDetails: () => void
  onClose: () => void
}

export function StationPopup({ station, onViewDetails, onClose }: StationPopupProps) {
  const color = getCategoryColor(station.category)
  const category = normalizeCategory(station.category)

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 max-w-[200px] shadow-xl">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-sm text-white leading-tight">
          {station.name}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors -mt-0.5 -mr-1 p-0.5"
          aria-label="Close popup"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
          style={{ background: color }}
        >
          {station.aqi}
        </div>
        <span className="text-sm text-slate-300">{category}</span>
      </div>

      <button
        onClick={onViewDetails}
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
      >
        View details
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

// Create HTML content for MapLibre popup
export function createPopupHTML(station: DisplayStation): string {
  const color = getCategoryColor(station.category)
  const category = normalizeCategory(station.category)

  return `
    <div class="station-popup" style="
      background: rgb(15, 23, 42);
      border: 1px solid rgb(51, 65, 85);
      border-radius: 8px;
      padding: 12px;
      max-width: 200px;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="display: flex; align-items: start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
        <h3 style="font-weight: 500; font-size: 14px; color: white; line-height: 1.3; margin: 0;">
          ${station.name}
        </h3>
        <button
          class="popup-close"
          style="color: rgb(148, 163, 184); background: none; border: none; cursor: pointer; padding: 2px; margin: -2px -4px 0 0;"
          aria-label="Close popup"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 20px;
          background: ${color};
        ">
          ${station.aqi}
        </div>
        <span style="font-size: 14px; color: rgb(203, 213, 225);">${category}</span>
      </div>

      <button
        class="popup-details"
        style="
          font-size: 12px;
          color: rgb(96, 165, 250);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        "
        data-station-id="${station.id}"
      >
        View details
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  `
}
