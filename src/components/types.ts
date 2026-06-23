/* ═══════════════════════════════════════════════════════════════════════════
   Shared Types
   ═══════════════════════════════════════════════════════════════════════════ */

export type StopRole = "DRIVER" | "STOP" | "SHOP";

export interface Location {
  id:      string;
  name:    string;
  lat:     number;
  lng:     number;
  raw:     string;
  role?:   StopRole;
  remark?: string;   // driver's per-stop note
}

export interface RouteResult {
  distanceMeters:  number;
  durationSeconds: number;
  encodedPolyline: string;
  /** Indices into the intermediates array (not the full locations array) */
  optimizedOrder:  number[];
}
