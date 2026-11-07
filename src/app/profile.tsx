import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Tapping anywhere on this dark overlay triggers handleClose */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <View style={styles.modalCard}>
        <View style={styles.handleBar} />

        <Text style={styles.title}>Student Profile</Text>
        <Text style={styles.name}>รอนนี่ นริศ สตุดวิค</Text>
        <Text style={styles.email}>ronnie.nar@dome.tu.ac.th</Text>
        <Text style={styles.info}>Student ID: 6823765109</Text>
        <Text style={styles.info}>
          College of Innovation (Digital Experience - DX)
        </Text>

        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: "55%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  email: {
    fontSize: 15,
    color: "#666",
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: "#888",
    marginBottom: 2,
  },
  closeButton: {
    marginTop: "auto",
    backgroundColor: "#F0F0F0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontWeight: "600",
    color: "#333",
  },
});
