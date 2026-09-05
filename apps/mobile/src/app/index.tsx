import { Redirect } from "expo-router";
/** Until Gate 2 there is one screen worth opening: the kit gallery. */
export default function Index() {
  return <Redirect href="/dev/kit" />;
}
