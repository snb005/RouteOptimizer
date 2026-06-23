import { useState } from "react";
import { Document, Page, Text, View, StyleSheet, Link, pdf } from "@react-pdf/renderer";
import type { Location, RouteResult } from "@/components/types";

function buildShareUrl(stops: Location[]) {
  return `https://www.google.com/maps/dir/${stops.map((l) => `${l.lat},${l.lng}`).join("/")}`;
}
function formatDistance(m: number) { return m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${m} m`; }
function formatDuration(s: number) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

const S = StyleSheet.create({
  page:        { padding: 40, backgroundColor: "#ffffff", fontFamily: "Helvetica" },
  header:      { fontSize: 18, marginBottom: 4, color: "#1d4ed8", textTransform: "uppercase", fontWeight: "bold" },
  subheader:   { fontSize: 9, color: "#6b7280", marginBottom: 20, textTransform: "uppercase", letterSpacing: 0.8 },

  statsRow:    { flexDirection: "row", marginBottom: 24, gap: 10 },
  statCard:    { flex: 1, padding: 12, border: "1 solid #e5e7eb", borderRadius: 8, backgroundColor: "#f9fafb" },
  statValue:   { fontSize: 20, fontWeight: "bold", color: "#1f2937", marginBottom: 4 },
  statLabel:   { fontSize: 9, color: "#6b7280", textTransform: "uppercase" },

  listTitle:   { fontSize: 11, fontWeight: "bold", color: "#6b7280", textTransform: "uppercase", marginBottom: 12 },

  // Table
  tableHeader: { flexDirection: "row", paddingBottom: 6, borderBottom: "1 solid #e5e7eb", marginBottom: 8 },
  tableRow:    { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, paddingBottom: 10, borderBottom: "1 solid #f3f4f6" },
  colBadge:    { width: 28 },
  colName:     { flex: 1, paddingRight: 8 },
  colRemark:   { width: 140 },
  colRole:     { width: 52 },

  thText:      { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", fontWeight: "bold" },
  badge:       { width: 22, height: 22, borderRadius: 11, backgroundColor: "#3b82f6", color: "white", fontSize: 9, textAlign: "center", paddingTop: 5 },
  itemText:    { fontSize: 10, color: "#374151", lineHeight: 1.5 },
  remarkText:  { fontSize: 9, color: "#92400e", backgroundColor: "#fffbeb", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, lineHeight: 1.5 },
  remarkEmpty: { fontSize: 9, color: "#d1d5db" },

  tagDriver:   { fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#dcfce7", color: "#15803d" },
  tagShop:     { fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#f3e8ff", color: "#7c3aed" },
  tagStop:     { fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#f3f4f6", color: "#6b7280" },

  divider:     { borderTop: "1 solid #e5e7eb", marginVertical: 24 },

  mapsBtn:     { backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12, textDecoration: "none" },
  mapsBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "bold", textAlign: "center" },

  footer:      { marginTop: 24, fontSize: 8, color: "#9ca3af", textAlign: "center" },
});

interface RoutePdfDocumentProps {
  result:           RouteResult;
  orderedLocations: Location[];
  driverName?:      string;
}

export function RoutePdfDocument({ result, orderedLocations, driverName }: RoutePdfDocumentProps) {
  const mapsUrl   = buildShareUrl(orderedLocations);
  const generated = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const roleFor = (idx: number) => {
    if (idx === 0)                          return "DRIVER";
    if (idx === orderedLocations.length-1)  return "SHOP";
    return "STOP";
  };

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Header */}
        <Text style={S.header}>Optimized Route</Text>
        <Text style={S.subheader}>
          {driverName ? `Driver: ${driverName}  ·  ` : ""}
          {orderedLocations.length} stops  ·  Generated {generated}
        </Text>

        {/* Stats */}
        <View style={S.statsRow}>
          <View style={S.statCard}>
            <Text style={S.statValue}>{formatDistance(result.distanceMeters)}</Text>
            <Text style={S.statLabel}>Total Distance</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statValue}>{formatDuration(result.durationSeconds)}</Text>
            <Text style={S.statLabel}>Est. Duration</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statValue}>{orderedLocations.length}</Text>
            <Text style={S.statLabel}>Total Stops</Text>
          </View>
        </View>

        {/* Stop Table with Remarks */}
        <Text style={S.listTitle}>Visit Order &amp; Remarks</Text>

        <View style={S.tableHeader}>
          <View style={S.colBadge}><Text style={S.thText}>#</Text></View>
          <View style={S.colName}><Text style={S.thText}>Location</Text></View>
          <View style={S.colRemark}><Text style={S.thText}>Driver Remark</Text></View>
          <View style={S.colRole}><Text style={S.thText}>Role</Text></View>
        </View>

        {orderedLocations.map((loc, idx) => {
          const role = loc.role ?? roleFor(idx);
          return (
            <View key={loc.id} style={S.tableRow}>
              <View style={S.colBadge}>
                <Text style={S.badge}>{idx + 1}</Text>
              </View>
              <View style={S.colName}>
                <Text style={S.itemText}>
                  {loc.name || `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`}
                </Text>
              </View>
              <View style={S.colRemark}>
                {loc.remark
                  ? <Text style={S.remarkText}>{loc.remark}</Text>
                  : <Text style={S.remarkEmpty}>—</Text>
                }
              </View>
              <View style={S.colRole}>
                <Text style={
                  role === "DRIVER" ? S.tagDriver :
                  role === "SHOP"   ? S.tagShop   : S.tagStop
                }>
                  {role}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={S.divider} />

        <Link src={mapsUrl} style={S.mapsBtn}>
          <Text style={S.mapsBtnText}>Open in Google Maps</Text>
        </Link>

        <Text style={S.footer}>
          RouteOptimizer · Auto-generated · {generated}
        </Text>
      </Page>
    </Document>
  );
}

export function useCopyRouteLink(orderedLocations: Location[]) {
  const [copied, setCopied] = useState(false);
  const handleShare = () => {
    navigator.clipboard.writeText(buildShareUrl(orderedLocations)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };
  return { copied, handleShare };
}

export async function downloadRoutePdf(
  result:           RouteResult,
  orderedLocations: Location[],
  driverName?:      string,
) {
  const blob = await pdf(
    <RoutePdfDocument result={result} orderedLocations={orderedLocations} driverName={driverName} />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `route-${new Date().toISOString().slice(0,10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
