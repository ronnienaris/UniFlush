import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type RestroomItem = {
  id: string;
  building: string;
  floor: string;
  open_time: string;
  close_time: string;
  rating: number;
  totalRatings: number;
  cleanlinessScore: number;
  distanceMeter: number;
  accessType: string;
  isAccessible: boolean;
  gender: "all" | "male" | "female";
  features: { bidet: boolean; tissue: boolean; ac: boolean; soap: boolean };
  coordinates?: { latitude: number; longitude: number };
  comments?: {
    id: string;
    user: string;
    score: number;
    comment: string;
    date: string;
  }[];
};

interface RestroomInfoProps {
  item: RestroomItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectBuilding: (spot: RestroomItem) => void;
  onOpenReviewModal: (spot: RestroomItem) => void;
}

export default function RestroomInfo({
  item,
  isFavorite,
  onToggleFavorite,
  onSelectBuilding,
  onOpenReviewModal,
}: RestroomInfoProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.genderBadge}>
          <Text style={styles.genderBadgeText}>
            {item.gender === "all"
              ? "🚻 ALL GENDER"
              : item.gender === "female"
                ? "🚺 FEMALE"
                : "🚹 MALE"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onToggleFavorite(item.id)}>
          <Text style={{ fontSize: 20 }}>{isFavorite ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.buildingTitle}>{item.building}</Text>
      <Text style={styles.floorText}>
        Floor:{" "}
        <Text style={{ color: "#1B5091", fontWeight: "600" }}>
          {item.floor}
        </Text>
      </Text>
      <Text style={styles.hoursText}>
        🕒 Hours: {item.open_time} - {item.close_time}
      </Text>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>DISTANCE</Text>
          <Text style={styles.metricVal}>{item.distanceMeter}m away</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>ACCESS</Text>
          <Text style={styles.metricVal}>{item.accessType}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>CLEANLINESS</Text>
          <Text style={styles.metricVal}>
            ✨ {item.cleanlinessScore.toFixed(1)}/5 ({item.totalRatings})
          </Text>
        </View>
      </View>

      {/* Amenity Chips */}
      <View style={styles.amenityRow}>
        {item.isAccessible && <Text style={styles.chip}>♿ Accessible</Text>}
        {item.features.bidet && <Text style={styles.chip}>💦 Bidet Spray</Text>}
        {item.features.ac && <Text style={styles.chip}>❄️ Air-Con</Text>}
        {item.features.tissue && <Text style={styles.chip}>🧻 Tissue</Text>}
        {item.features.soap && <Text style={styles.chip}>🧼 Soap</Text>}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.btn, styles.primaryNavBtn]}
          onPress={() => onSelectBuilding(item)}
        >
          <Text style={styles.primaryBtnText}>🧭 Navigate & Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.secondaryRateBtn]}
          onPress={() => onOpenReviewModal(item)}
        >
          <Text style={styles.secondaryBtnText}>💬 Review & Score</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  genderBadge: {
    backgroundColor: "#EBF3FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  genderBadgeText: { color: "#1B5091", fontSize: 10, fontWeight: "bold" },
  buildingTitle: { fontSize: 16, fontWeight: "bold", color: "#0F172A" },
  floorText: { fontSize: 12, color: "#64748B", marginTop: 2 },
  hoursText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginTop: 2,
  },

  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  metricBox: { alignItems: "flex-start" },
  metricLabel: { fontSize: 9, fontWeight: "700", color: "#94A3B8" },
  metricVal: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#334155",
    marginTop: 2,
  },

  amenityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: "#F1F5F9",
    fontSize: 10,
    color: "#475569",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  actionRow: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryNavBtn: { backgroundColor: "#1B5091" },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 12 },

  secondaryRateBtn: {
    backgroundColor: "#EBF3FA",
    borderWidth: 1,
    borderColor: "#D0E1F4",
  },
  secondaryBtnText: { color: "#1B5091", fontWeight: "bold", fontSize: 12 },
});
