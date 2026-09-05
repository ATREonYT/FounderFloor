import { Redirect } from "expo-router";
/** The app opens at the desk, the way every assistant app opens on its composer. */
export default function Index() {
  return <Redirect href="/reception" />;
}
