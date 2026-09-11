/**
 * The three faces the site puts on screen, under the names tokens.ts uses.
 *
 * Archivo comes from Google exactly as next/font/google fetches it for the
 * site; IBM Plex Sans and Mono are the site's own self-hosted files, copied
 * into packages/ui/assets/fonts. Spectral is OG-card-only and is not here.
 * `font-synthesis: none` is a site rule: never fake a bold — load the weight.
 */
import { Archivo_600SemiBold, Archivo_700Bold } from "@expo-google-fonts/archivo";

/** The faces the brand always had: Archivo for display and controls, IBM Plex Sans for the body, Plex Mono for code. Never a system default, never Inter. */
export const FONT_MAP = {
  "Archivo-SemiBold": Archivo_600SemiBold,
  "Archivo-Bold": Archivo_700Bold,
  IBMPlexSans: require("../assets/fonts/IBMPlexSans-Variable.ttf"),
  "IBMPlexSans-Medium": require("../assets/fonts/IBMPlexSans-Variable.ttf"),
  IBMPlexMono: require("../assets/fonts/IBMPlexMono-Regular.ttf"),
  "IBMPlexMono-Medium": require("../assets/fonts/IBMPlexMono-Medium.ttf"),
} as const;
