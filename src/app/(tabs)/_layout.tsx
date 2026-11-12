import { Tabs } from 'expo-router/js-tabs';

import { NavBar } from '@/components/nav-bar';
import { useColors, useIsWide } from '@/lib/theme';

export default function TabsLayout() {
  const wide = useIsWide();
  const c = useColors();
  return (
    <Tabs
      tabBar={(props) => <NavBar {...props} wide={wide} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        sceneStyle: { backgroundColor: c.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Trips' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
