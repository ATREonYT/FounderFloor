/**
 * The three faces the site puts on screen, under the names tokens.ts uses.
 *
 * Archivo comes from Google exactly as next/font/google fetches it for the
 * site; IBM Plex Sans and Mono are the site's own self-hosted files, copied
 * into packages/ui/assets/fonts. Spectral is OG-card-only and is not here.
 * `font-synthesis: none` is a site rule: never fake a bold — load the weight.
 */
import { Archivo_400Regular, Archivo_500Medium } from "@expo-google-fonts/archivo";

export const FONT_MAP = {
  Archivo: Archivo_400Regular,
  "Archivo-Medium": Archivo_500Medium,
  IBMPlexSans: require("../assets/fonts/IBMPlexSans-Variable.ttf"),
  "IBMPlexSans-Medium": require("../assets/fonts/IBMPlexSans-Variable.ttf"),
  IBMPlexMono: require("../assets/fonts/IBMPlexMono-Regular.ttf"),
  "IBMPlexMono-Medium": require("../assets/fonts/IBMPlexMono-Medium.ttf"),
} as const;
