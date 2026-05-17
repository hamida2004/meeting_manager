import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="(Home)"
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#9CA3AF",

        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="(Home)"
        options={{
          title: "Home",

          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(Meetings)"
        options={{
          title: "Meetings",

          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                focused
                  ? "calendar"
                  : "calendar-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(Profile)"
        options={{
          title: "Profile",

          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                focused
                  ? "person"
                  : "person-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}