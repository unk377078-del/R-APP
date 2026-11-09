import { Appearance, Platform, StyleSheet } from 'react-native';

export type ColorScheme = 'light' | 'dark';
const isNative = Platform.OS !== 'web';
const light = {
  navy: '#0E2F65', blue: '#174A9C', gold: '#D97706', action: '#174A9C', actionText: '#FFFFFF', cream: '#F4F7FC', ink: '#0F172A',
  muted: '#64748B', line: 'rgba(226, 232, 240, 0.8)', white: '#FFFFFF', green: '#15803D', red: '#DC2626',
  background: '#F1F5F9',
  surface: isNative ? '#FFFFFF' : 'rgba(255, 255, 255, 0.88)',
  solidSurface: '#FFFFFF',
  border: isNative ? '#E2E8F0' : 'rgba(255, 255, 255, 0.92)',
  inputBorder: '#CBD5E1',
  surfaceAlt: isNative ? '#F8FAFC' : 'rgba(241, 245, 249, 0.85)',
  selected: '#E0E7FF',
};
const dark: typeof light = {
  navy: '#E2EEFE', blue: '#93C5FD', gold: '#FCD34D', action: '#3B82F6', actionText: '#FFFFFF', cream: '#0F172A', ink: '#F8FAFC',
  muted: '#94A3B8', line: 'rgba(255, 255, 255, 0.1)', white: '#FFFFFF', green: '#4ADE80', red: '#F87171',
  background: '#0B111A',
  surface: isNative ? '#162231' : 'rgba(22, 33, 47, 0.85)',
  solidSurface: '#162231',
  border: 'rgba(255, 255, 255, 0.12)',
  inputBorder: 'rgba(255, 255, 255, 0.16)',
  surfaceAlt: isNative ? '#1E2C3E' : 'rgba(30, 44, 62, 0.80)',
  selected: 'rgba(59, 130, 246, 0.25)',
};
export function getSystemColorScheme(): ColorScheme {
  try {
    return Appearance?.getColorScheme?.() === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}
let scheme: ColorScheme = getSystemColorScheme();
if (typeof Appearance?.addChangeListener === 'function') {
  try {
    Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === 'dark' || colorScheme === 'light') {
        scheme = colorScheme;
      }
    });
  } catch {}
}
const fontBold = Platform.select({
  ios: 'Rubik_700Bold',
  android: 'Rubik_700Bold',
  default: 'Rubik, Cairo, sans-serif',
});
const fontRegular = Platform.select({
  ios: 'Rubik_400Regular',
  android: 'Rubik_400Regular',
  default: 'Rubik, Cairo, sans-serif',
});
export const fontRuqaaBold = Platform.select({
  ios: 'ArefRuqaa_700Bold',
  android: 'ArefRuqaa_700Bold',
  default: "'Aref Ruqaa', 'ArefRuqaa_700Bold', serif",
});
export const fontRuqaaRegular = Platform.select({
  ios: 'ArefRuqaa_400Regular',
  android: 'ArefRuqaa_400Regular',
  default: "'Aref Ruqaa', 'ArefRuqaa_400Regular', serif",
});

const palettes = { light, dark };
function createStyles(p: typeof light, isDark: boolean) {
  const glassStyle = Platform.OS === 'web' ? {
    backdropFilter: 'blur(22px) saturate(190%)',
    WebkitBackdropFilter: 'blur(22px) saturate(190%)',
  } : {};
  const ruqaaStroke = Platform.OS === 'web' ? {
    WebkitTextStroke: isDark ? '0.55px rgba(245, 201, 92, 0.55)' : '0.45px rgba(217, 119, 6, 0.42)',
    paintOrder: 'stroke fill',
  } : {};
  const ruqaaShadow = {
    textShadowColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(217, 119, 6, 0.22)',
    textShadowOffset: { width: 0, height: isDark ? 1.5 : 1 },
    textShadowRadius: isDark ? 2.5 : 1.5,
  };
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: p.background },
    scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, width: '100%', maxWidth: 900, alignSelf: 'center' },
    row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
    rowLTR: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowRTL: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontFamily: fontRuqaaBold, fontSize: 29, fontWeight: '700', color: p.navy, textAlign: 'right', writingDirection: 'rtl', lineHeight: 40, ...ruqaaShadow, ...ruqaaStroke },
    subtitle: { fontFamily: fontRegular, fontSize: 12, color: p.muted, textAlign: 'right', writingDirection: 'rtl', marginTop: 2, lineHeight: 19 },
    card: { backgroundColor: p.surface, borderRadius: 24, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: p.border, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.95)', borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(226, 232, 240, 0.65)', shadowColor: isDark ? '#000000' : p.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.35 : 0.07, shadowRadius: 20, elevation: 3, ...glassStyle },
    pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, backgroundColor: isDark ? 'rgba(30, 44, 62, 0.75)' : 'rgba(255, 255, 255, 0.75)', marginRight: 8, minHeight: 40, justifyContent: 'center', borderWidth: 1, borderColor: p.border, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 1)', borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(226, 232, 240, 0.6)', ...glassStyle },
    pillText: { fontFamily: fontRegular, fontSize: 11, color: p.ink, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
    button: { backgroundColor: p.action, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 50, shadowColor: p.action, shadowOffset: { width: 0, height: 6 }, shadowOpacity: isDark ? 0.32 : 0.18, shadowRadius: 10, elevation: 3, borderWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.40)', borderColor: 'rgba(255, 255, 255, 0.14)' },
    buttonText: { fontFamily: fontRegular, color: p.actionText, fontWeight: '800', fontSize: 13, textAlign: 'center', writingDirection: 'rtl' },
    input: { backgroundColor: isDark ? 'rgba(18, 28, 42, 0.85)' : 'rgba(255, 255, 255, 0.88)', borderColor: p.inputBorder, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.95)', borderWidth: 1, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 12, textAlign: 'right', writingDirection: 'rtl', fontSize: 13, color: p.ink, marginTop: 8, minHeight: 50, fontFamily: fontRegular, ...glassStyle },
    small: { fontFamily: fontRegular, fontSize: 11, color: p.muted, textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },
    section: { fontFamily: fontRuqaaBold, fontSize: 24, fontWeight: '700', color: p.navy, textAlign: 'right', writingDirection: 'rtl', marginTop: 21, marginBottom: 10, lineHeight: 34, ...ruqaaShadow, ...ruqaaStroke },
  });
}
const styles = { light: createStyles(light, false), dark: createStyles(dark, true) };
export function setColorScheme(next: ColorScheme) { scheme = next; }
export function getActiveColorScheme(): ColorScheme { return scheme; }
export function isDarkMode(): boolean { return scheme === 'dark'; }
export const C = new Proxy({} as typeof light, { get: (_target, key: keyof typeof light) => palettes[scheme][key] });
export const s = new Proxy({} as ReturnType<typeof createStyles>, { get: (_target, key: keyof ReturnType<typeof createStyles>) => styles[scheme][key] });
