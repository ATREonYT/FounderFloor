/**
 * The three faces the site puts on screen, under the names tokens.ts uses.
 *
 * Archivo comes from Google exactly as next/font/google fetches it for the
 * site; IBM Plex Sans and Mono are the site's own self-hosted files, copied
 * into packages/ui/assets/fonts. Spectral is OG-card-only and is not here.
 * `font-synthesis: none` is a site rule: never fake a bold — load the weight.
 */
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";

/** The night hall: one family, Inter, at four weights. Plex Mono stays for code and pasted text. */
export const FONT_MAP = {
  Inter: Inter_400Regular,
  "Inter-Medium": Inter_500Medium,
  "Inter-SemiBold": Inter_600SemiBold,
  "Inter-Bold": Inter_700Bold,
  IBMPlexMono: require("../assets/fonts/IBMPlexMono-Regular.ttf"),
  "IBMPlexMono-Medium": require("../assets/fonts/IBMPlexMono-Medium.ttf"),
} as const;
