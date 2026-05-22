import { Tabs } from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  useAuth,
} from "../../context/AuthContext";

export default function TabsLayout() {
  const { user } =
    useAuth();

  return (
    <Tabs
      initialRouteName="(Home)"
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          "#4F46E5",

        tabBarInactiveTintColor:
          "#9CA3AF",

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
      {/* HOME */}

      <Tabs.Screen
        name="(Home)"
        options={{
          title: "Home",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "home"
                  : "home-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* MEETINGS */}

      <Tabs.Screen
        name="(Meetings)"
        options={{
          title: "Meetings",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
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

      {/* ADMIN MANAGE */}

      <Tabs.Screen
        name="(Manage)"
        options={{
          href:
            user?.is_admin
              ? undefined
              : null,

          title: "Manage",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "settings"
                  : "settings-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* PROFILE */}

      <Tabs.Screen
        name="(Profile)"
        options={{
          title: "Profile",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
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