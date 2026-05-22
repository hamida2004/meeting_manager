import { Stack } from "expo-router";

export default function AuthLayout() {

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="Login"
      />

      <Stack.Screen
        name="Register"
      />

      <Stack.Screen
        name="ResetPwd"
      />

      <Stack.Screen
        name="NewPassword"
      />
    </Stack>
  );
}