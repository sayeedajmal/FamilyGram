const tintColorLight = "#ebeded"; // Subtle Blue-Green Accent
const tintColorDark = "#2a2b2c"; // Darker but still soft gray for better contrast

export const Colors = {
  light: {
    text: "#1F2937",
    background: "#FFFFFF",
    tint: tintColorLight,
    icon: "#0278ae",
    messageUser: "#E5E7EB",
    messageBot: "#F9FAFB",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#0278ae",
    skeletonBg: "#f3f4f6", // Light Gray for smooth contrast
    skeletonFg: "#e5e7eb", // **Softer contrast for skeleton loaders**
  },
  dark: {
    text: "#ECEDEE",
    background: "#18191a", // **Darker background for more depth**
    tint: tintColorDark,
    icon: "#0278ae",
    messageUser: "#242526", // Slightly lighter than bg for separation
    messageBot: "#1e1f20", // Dark Gray for subtle contrast
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#0278ae",
    skeletonBg: "#303133", // **Better contrast for dark mode**
    skeletonFg: "#505254", // **Subtle highlight effect for dark skeleton loaders**
  },
};

export default { Colors };
