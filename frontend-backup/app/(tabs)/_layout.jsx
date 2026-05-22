import { Tabs } from "expo-router";

export default function TabsLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >

      <Tabs.Screen
        name="(Home)"
        options={{
          title: "Home",
        }}
      />

      <Tabs.Screen
        name="(Meetings)"
        options={{
          title: "Meetings",
        }}
      />

      <Tabs.Screen
        name="(Profile)"
        options={{
          title: "Profile",
        }}
      />

    </Tabs>
  );
}