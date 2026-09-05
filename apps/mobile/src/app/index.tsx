import { Redirect } from "expo-router";
import { useFounder } from "../lib/store";
/** First launch opens on the three doors; after that, the desk. */
export default function Index() {
  const door = useFounder((s) => s.door);
  return <Redirect href={door ? "/reception" : "/start"} />;
}
