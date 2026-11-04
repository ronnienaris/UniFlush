import RestroomInfo, { RestroomItem } from "@/components/RestroomInfo";
import { styles } from "@/styles";
import { supabase } from "@/utils/supabase";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export default function Index() {
  const [screen, setScreen] = useState<"splash" | "auth" | "main">("splash");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<
    "favs" | "report" | "settings" | "faq"
  >("favs");

  const [userName] = useState("Ronnie Strudwicke");
  const [userGender, setUserGender] = useState<"all" | "male" | "female">(
    "all",
  );
  const [prefAccessible, setPrefAccessible] = useState<boolean>(false);
  const [prefBidet, setPrefBidet] = useState<boolean>(false);

  const [restrooms, setRestrooms] = useState<RestroomItem[]>([]);
  const [isLoadingRestrooms, setIsLoadingRestrooms] = useState<boolean>(true);

  const [favorites, setFavorites] = useState<string[]>(["1"]); // Adjusted default favorite ID to match Supabase row IDs or building IDs
  const [selectedSpot, setSelectedSpot] = useState<RestroomItem | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Review & Rating Modal state
  const [reviewSpot, setReviewSpot] = useState<RestroomItem | null>(null);
  const [inputCleanlinessScore, setInputCleanlinessScore] = useState<number>(5);
  const [inputComment, setInputComment] = useState<string>("");

  // Profile Tab Issue Report state
  const [reportRestroomTarget, setReportRestroomTarget] = useState<string>("1");
  const [reportIssueType, setReportIssueType] =
    useState<string>("Out of Tissue");
  const [reportDescription, setReportDescription] = useState<string>("");

  // Fetch live data from Supabase
  useEffect(() => {
    async function fetchSupabaseRestrooms() {
      try {
        setIsLoadingRestrooms(true);
        const { data, error } = await supabase.from("restrooms").select(`
            *,
            buildings (
              building_name,
              latitude,
              longitude,
              open_time,
              close_time,
              access_condition
            )
          `);

        if (error) {
          console.error("❌ Supabase fetch error:", error.message);
          return;
        }

        if (data) {
          const formattedData: RestroomItem[] = data.map((item: any) => ({
            id: (item.restroom_id || item.id || Math.random()).toString(),
            building: item.buildings?.building_name || "Unknown Building",
            floor: item.Floor || "1st Floor",
            open_time: item.buildings?.open_time || "06:00",
            close_time: item.buildings?.close_time || "20:00",
            rating: 4.5,
            totalRatings: 30,
            cleanlinessScore: 4.5,
            distanceMeter: 0,
            accessType: item.buildings?.access_condition || "Open Access",
            isAccessible: true,
            gender: item.gender_type || "all",
            features: {
              bidet: item.has_bidet,
              tissue: item.has_toilet_paper,
              ac: item.has_air_con,
              soap: item.has_soap,
            },
            coordinates: {
              latitude: item.buildings?.latitude || 13.7563,
              longitude: item.buildings?.longitude || 100.4934,
            },
            comments: [
              {
                id: "c1",
                user: "TU Student",
                score: 5,
                comment: "Very clean and well maintained!",
                date: "Today",
              },
            ],
          }));

          setRestrooms(formattedData);
          if (formattedData.length > 0) {
            setReportRestroomTarget(formattedData[0].id);
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching restrooms:", err);
      } finally {
        setIsLoadingRestrooms(false);
      }
    }

    fetchSupabaseRestrooms();
  }, []);

  useEffect(() => {
    if (screen === "splash") {
      const timer = setTimeout(() => setScreen("auth"), 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let location = await Location.getCurrentPositionAsync({});
      const initCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(initCoords);

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 3 },
        (loc) => {
          const currentCoords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setUserLocation(currentCoords);

          setRestrooms((prev) =>
            prev.map((item) => {
              if (!item.coordinates) return item;
              return {
                ...item,
                distanceMeter: getDistanceInMeters(
                  currentCoords.latitude,
                  currentCoords.longitude,
                  item.coordinates.latitude,
                  item.coordinates.longitude,
                ),
              };
            }),
          );
        },
      );
    })();
  }, []);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id],
    );
  };

  const handleSubmitReview = () => {
    if (!reviewSpot) return;
    if (!inputComment.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter a comment for your review.",
      );
      return;
    }

    setRestrooms((prev) =>
      prev.map((item) => {
        if (item.id === reviewSpot.id) {
          const newTotal = item.totalRatings + 1;
          const newCleanliness =
            (item.cleanlinessScore * item.totalRatings +
              inputCleanlinessScore) /
            newTotal;
          const newComment = {
            id: Date.now().toString(),
            user: userName,
            score: inputCleanlinessScore,
            comment: inputComment.trim(),
            date: "Just now",
          };
          return {
            ...item,
            totalRatings: newTotal,
            cleanlinessScore: newCleanliness,
            comments: [newComment, ...(item.comments || [])],
          };
        }
        return item;
      }),
    );

    Alert.alert(
      "Review Submitted!",
      "Thank you for scoring cleanliness and leaving feedback.",
    );
    setReviewSpot(null);
    setInputComment("");
    setInputCleanlinessScore(5);
  };

  const handleProfileIssueSubmit = () => {
    if (!reportDescription.trim()) {
      Alert.alert(
        "Missing Description",
        "Please write a brief description of the issue.",
      );
      return;
    }

    Alert.alert(
      "Thank you for reporting!",
      "Your report has been received by campus maintenance.",
    );
    setReportDescription("");
  };

  const handleLocateNearest = () => {
    if (restrooms.length === 0) return;
    const sorted = [...restrooms].sort(
      (a, b) => a.distanceMeter - b.distanceMeter,
    );
    setSelectedSpot(sorted[0]);
  };

  const filteredRestrooms = restrooms
    .filter((item) => {
      if (
        searchQuery &&
        !item.building.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (
        userGender !== "all" &&
        item.gender !== userGender &&
        item.gender !== "all"
      )
        return false;
      if (prefAccessible && !item.isAccessible) return false;
      if (prefBidet && !item.features.bidet) return false;
      return true;
    })
    .sort((a, b) => a.distanceMeter - b.distanceMeter);

  const favoriteRestrooms = restrooms.filter((item) =>
    favorites.includes(item.id),
  );

  if (screen === "splash") {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require("../../assets/splash-logo.png")}
          style={{ width: 300, height: 300, resizeMode: "contain" }}
        />
        <Text style={styles.splashTitle}>UniFlush</Text>
        <Text style={styles.splashSub}>
          Campus Restroom & Indoor Navigation
        </Text>
        <ActivityIndicator
          size="large"
          color="#1B5091"
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  if (screen === "auth") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.appTitle}>UniFlush</Text>
          <Text style={styles.appSubtitle}>
            {authMode === "login"
              ? "Sign in to access campus toilets"
              : "Create your account"}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CAMPUS EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="student@tu.ac.th"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setScreen("main")}
          >
            <Text style={styles.primaryBtnText}>
              {authMode === "login" ? "Log In" : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setAuthMode(authMode === "login" ? "register" : "login")
            }
            style={{ marginTop: 16 }}
          >
            <Text style={styles.switchText}>
              {authMode === "login"
                ? "Don't have an account? "
                : "Already registered? "}
              <Text style={{ color: "#1B5091", fontWeight: "bold" }}>
                {authMode === "login" ? "Register" : "Log In"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerLogo}>UniFlush 📍</Text>
          <Text style={styles.headerSub}>Thammasat Campus Navigator</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.profileHeaderBtn}
          onPress={() => setIsDrawerOpen(true)}
        >
          <Text style={styles.profileHeaderBtnText}>👤 Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={styles.sosCard}>
          <Text style={styles.sosTag}>CAMPUS NAVIGATION SYSTEM</Text>
          <Text style={styles.sosTitle}>Locate Nearest Campus Restroom</Text>
          <TouchableOpacity
            style={styles.sosActionBtn}
            onPress={handleLocateNearest}
          >
            <Text style={styles.sosActionText}>
              🧭 LOCATE NEAREST & MAP ROUTE
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.input,
            { marginBottom: 12, backgroundColor: "#FFFFFF" },
          ]}
          placeholder="🔍 Search building by name..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.prefBar}>
          <Text style={styles.prefBarText}>
            Active Preferences:{" "}
            <Text style={{ fontWeight: "bold", color: "#1B5091" }}>
              {userGender.toUpperCase()} •{" "}
              {prefAccessible ? "♿ Accessible" : "Standard"} •{" "}
              {prefBidet ? "💦 Bidet" : "All"}
            </Text>
          </Text>
        </View>

        <Text style={styles.sectionHeader}>
          AVAILABLE BUILDINGS ({filteredRestrooms.length})
        </Text>

        {isLoadingRestrooms ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#1B5091" />
            <Text style={{ marginTop: 10, color: "#64748B" }}>
              Loading campus restrooms from Supabase...
            </Text>
          </View>
        ) : filteredRestrooms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32 }}>🔍</Text>
            <Text style={styles.emptyText}>No matching restrooms found.</Text>
            <Text style={styles.emptySubText}>
              Adjust your search or settings preferences to see more buildings.
            </Text>
          </View>
        ) : (
          filteredRestrooms.map((item) => (
            <RestroomInfo
              key={item.id}
              item={item}
              isFavorite={favorites.includes(item.id)}
              onToggleFavorite={handleToggleFavorite}
              onSelectBuilding={(spot) => setSelectedSpot(spot)}
              onOpenReviewModal={(spot) => setReviewSpot(spot)}
            />
          ))
        )}
      </ScrollView>

      {/* PROFILE BOTTOM SHEET DRAWER MODAL */}
      <Modal
        visible={isDrawerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsDrawerOpen(false)}
      >
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerHandle} />

            <View style={styles.userHeader}>
              <View style={styles.avatarCircle}>
                <Text
                  style={{ fontSize: 20, fontWeight: "bold", color: "#1B5091" }}
                >
                  {userName.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.userRole}>Thammasat Student Account</Text>
              </View>
            </View>

            <View style={styles.menuGrid}>
              <TouchableOpacity
                style={[
                  styles.menuTabBtn,
                  drawerTab === "favs" && styles.menuTabActive,
                ]}
                onPress={() => setDrawerTab("favs")}
              >
                <Text
                  style={[
                    styles.menuTabText,
                    drawerTab === "favs" && styles.menuTabTextActive,
                  ]}
                >
                  ❤️ Favorites ({favorites.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.menuTabBtn,
                  drawerTab === "report" && styles.menuTabActive,
                ]}
                onPress={() => setDrawerTab("report")}
              >
                <Text
                  style={[
                    styles.menuTabText,
                    drawerTab === "report" && styles.menuTabTextActive,
                  ]}
                >
                  ⚠️ Report Issue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.menuTabBtn,
                  drawerTab === "settings" && styles.menuTabActive,
                ]}
                onPress={() => setDrawerTab("settings")}
              >
                <Text
                  style={[
                    styles.menuTabText,
                    drawerTab === "settings" && styles.menuTabTextActive,
                  ]}
                >
                  ⚙️ Settings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.menuTabBtn,
                  drawerTab === "faq" && styles.menuTabActive,
                ]}
                onPress={() => setDrawerTab("faq")}
              >
                <Text
                  style={[
                    styles.menuTabText,
                    drawerTab === "faq" && styles.menuTabTextActive,
                  ]}
                >
                  ❓ FAQ
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerBody}>
              {drawerTab === "favs" && (
                <View>
                  <Text style={styles.sectionHeader}>SAVED FAVORITES</Text>
                  {favoriteRestrooms.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={{ fontSize: 28 }}>🤍</Text>
                      <Text style={styles.emptyText}>
                        No saved favorites yet.
                      </Text>
                      <Text style={styles.emptySubText}>
                        Tap the heart icon on any building to add it here.
                      </Text>
                    </View>
                  ) : (
                    favoriteRestrooms.map((item) => (
                      <RestroomInfo
                        key={item.id}
                        item={item}
                        isFavorite={true}
                        onToggleFavorite={handleToggleFavorite}
                        onSelectBuilding={(spot) => {
                          setIsDrawerOpen(false);
                          setSelectedSpot(spot);
                        }}
                        onOpenReviewModal={(spot) => setReviewSpot(spot)}
                      />
                    ))
                  )}
                </View>
              )}

              {/* REPORT ISSUE TAB INSIDE PROFILE */}
              {drawerTab === "report" && (
                <View>
                  <Text style={styles.sectionHeader}>
                    SUBMIT AN ISSUE REPORT
                  </Text>

                  <Text style={styles.prefLabel}>SELECT RESTROOM LOCATION</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 12 }}
                  >
                    {restrooms.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.filterChip,
                          { paddingHorizontal: 12, marginRight: 6 },
                          reportRestroomTarget === item.id &&
                            styles.filterChipActive,
                        ]}
                        onPress={() => setReportRestroomTarget(item.id)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            reportRestroomTarget === item.id &&
                              styles.filterChipTextActive,
                          ]}
                        >
                          {item.building.split(" ")[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.prefLabel}>SELECT ISSUE TYPE</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 12,
                    }}
                  >
                    {[
                      "Out of Tissue",
                      "Out of Soap",
                      "Water Leak",
                      "Cleanliness Issue",
                      "Maintenance Required",
                    ].map((issue) => (
                      <TouchableOpacity
                        key={issue}
                        style={[
                          styles.filterChip,
                          { minWidth: "47%" },
                          reportIssueType === issue && styles.filterChipActive,
                        ]}
                        onPress={() => setReportIssueType(issue)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            reportIssueType === issue &&
                              styles.filterChipTextActive,
                          ]}
                        >
                          {issue}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.prefLabel}>DESCRIPTION</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        height: 75,
                        textAlignVertical: "top",
                        marginBottom: 12,
                        backgroundColor: "#F8FAFC",
                      },
                    ]}
                    multiline
                    placeholder="Describe the issue in detail..."
                    placeholderTextColor="#94A3B8"
                    value={reportDescription}
                    onChangeText={setReportDescription}
                  />

                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: "#1B5091" }]}
                    onPress={handleProfileIssueSubmit}
                  >
                    <Text style={styles.primaryBtnText}>
                      Submit Issue Report
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {drawerTab === "settings" && (
                <View>
                  <Text style={styles.sectionHeader}>
                    FILTER & AMENITY PREFERENCES
                  </Text>

                  <Text style={styles.prefLabel}>GENDER PREFERENCE</Text>
                  <View style={styles.filterRow}>
                    {(["all", "male", "female"] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.filterChip,
                          userGender === g && styles.filterChipActive,
                        ]}
                        onPress={() => setUserGender(g)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            userGender === g && styles.filterChipTextActive,
                          ]}
                        >
                          {g.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.prefLabel, { marginTop: 10 }]}>
                    REQUIRED NECESSITIES
                  </Text>
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        prefAccessible && styles.toggleBtnActive,
                      ]}
                      onPress={() => setPrefAccessible(!prefAccessible)}
                    >
                      <Text style={styles.toggleText}>
                        ♿ Accessible Toilet
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        prefBidet && styles.toggleBtnActive,
                      ]}
                      onPress={() => setPrefBidet(!prefBidet)}
                    >
                      <Text style={styles.toggleText}>
                        💦 Bidet Spray Needed
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {drawerTab === "faq" && (
                <View>
                  <Text style={styles.sectionHeader}>
                    FREQUENTLY ASKED QUESTIONS
                  </Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoQ}>
                      Q: How is cleanliness scored?
                    </Text>
                    <Text style={styles.infoA}>
                      Cleanliness scores are calculated based on real-time
                      ratings (1 to 5 stars) submitted by students on campus.
                    </Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoQ}>
                      Q: Where do issue reports go?
                    </Text>
                    <Text style={styles.infoA}>
                      Reports are logged directly into the UniFlush database and
                      forwarded to campus maintenance.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setIsDrawerOpen(false);
                setScreen("auth");
              }}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeDrawerBtn}
              onPress={() => setIsDrawerOpen(false)}
            >
              <Text style={styles.closeDrawerText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CLEANLINESS REVIEW & SCORE MODAL */}
      <Modal
        visible={!!reviewSpot}
        animationType="slide"
        transparent
        onRequestClose={() => setReviewSpot(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTag}>RESTROOM CLEANLINESS REVIEW</Text>
            <Text style={styles.modalTitle}>{reviewSpot?.building}</Text>

            <Text style={[styles.prefLabel, { marginTop: 14 }]}>
              CLEANLINESS SCORE (1 to 5)
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.filterChip,
                    inputCleanlinessScore === num && styles.filterChipActive,
                  ]}
                  onPress={() => setInputCleanlinessScore(num)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      inputCleanlinessScore === num &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {num} ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.prefLabel}>COMMENT</Text>
            <TextInput
              style={[
                styles.input,
                {
                  height: 75,
                  textAlignVertical: "top",
                  marginBottom: 14,
                  backgroundColor: "#F8FAFC",
                },
              ]}
              multiline
              placeholder="Write a brief comment about hygiene, soap, or tissue levels..."
              placeholderTextColor="#94A3B8"
              value={inputComment}
              onChangeText={setInputComment}
            />

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: "#1B5091", marginBottom: 10 },
              ]}
              onPress={handleSubmitReview}
            >
              <Text style={styles.primaryBtnText}>
                Submit Cleanliness Review
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setReviewSpot(null)}
            >
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LIVE MAP ROUTE MODAL */}
      <Modal
        visible={!!selectedSpot}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedSpot(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTag}>THA PRACHAN LIVE NAVIGATION</Text>
            <Text style={styles.modalTitle}>{selectedSpot?.building}</Text>
            <Text style={styles.modalFloor}>
              📍 Target: {selectedSpot?.floor}
            </Text>

            {selectedSpot?.coordinates ? (
              <MapView
                style={{ height: 230, borderRadius: 14, marginVertical: 12 }}
                initialRegion={{
                  latitude: selectedSpot.coordinates.latitude,
                  longitude: selectedSpot.coordinates.longitude,
                  latitudeDelta: 0.003,
                  longitudeDelta: 0.003,
                }}
                showsUserLocation={true}
                showsCompass={true}
              >
                {userLocation && (
                  <Marker
                    coordinate={userLocation}
                    title="You Are Here"
                    pinColor="#1B5091"
                  />
                )}

                <Marker
                  coordinate={selectedSpot.coordinates}
                  title={selectedSpot.building}
                  description={selectedSpot.floor}
                  pinColor="#EF4444"
                />

                {userLocation && (
                  <Polyline
                    coordinates={[userLocation, selectedSpot.coordinates]}
                    strokeColor="#1B5091"
                    strokeWidth={4}
                    lineDashPattern={[6, 6]}
                  />
                )}
              </MapView>
            ) : (
              <View style={styles.mapContainer}>
                <Text style={{ textAlign: "center", color: "#64748B" }}>
                  Connecting to GPS...
                </Text>
              </View>
            )}

            <View style={styles.navStepBox}>
              <Text style={styles.navStepHeader}>INDOOR ROUTE DIRECTIONS:</Text>
              <Text style={styles.stepText}>
                1. Walk to main entrance of {selectedSpot?.building}.
              </Text>
              <Text style={styles.stepText}>
                2. Take elevator/stairs to {selectedSpot?.floor}.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setSelectedSpot(null)}
            >
              <Text style={styles.closeModalText}>Close Route Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
