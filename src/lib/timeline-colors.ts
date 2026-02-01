// Predefined color palette for timeline Gantt bars
export type TimelineColorKey = 
  | "red" 
  | "orange" 
  | "yellow" 
  | "green" 
  | "teal" 
  | "blue" 
  | "purple" 
  | "pink" 
  | "gray";

export interface TimelineColorConfig {
  bg: string;
  hover: string;
  text: string;
  swatch: string; // For color picker display
}

export const TIMELINE_COLORS: Record<TimelineColorKey, TimelineColorConfig> = {
  red: { 
    bg: "bg-red-500", 
    hover: "hover:bg-red-600", 
    text: "text-white",
    swatch: "bg-red-500"
  },
  orange: { 
    bg: "bg-orange-500", 
    hover: "hover:bg-orange-600", 
    text: "text-white",
    swatch: "bg-orange-500"
  },
  yellow: { 
    bg: "bg-yellow-400", 
    hover: "hover:bg-yellow-500", 
    text: "text-gray-900",
    swatch: "bg-yellow-400"
  },
  green: { 
    bg: "bg-green-500", 
    hover: "hover:bg-green-600", 
    text: "text-white",
    swatch: "bg-green-500"
  },
  teal: { 
    bg: "bg-teal-500", 
    hover: "hover:bg-teal-600", 
    text: "text-white",
    swatch: "bg-teal-500"
  },
  blue: { 
    bg: "bg-blue-500", 
    hover: "hover:bg-blue-600", 
    text: "text-white",
    swatch: "bg-blue-500"
  },
  purple: { 
    bg: "bg-purple-500", 
    hover: "hover:bg-purple-600", 
    text: "text-white",
    swatch: "bg-purple-500"
  },
  pink: { 
    bg: "bg-pink-500", 
    hover: "hover:bg-pink-600", 
    text: "text-white",
    swatch: "bg-pink-500"
  },
  gray: { 
    bg: "bg-gray-400", 
    hover: "hover:bg-gray-500", 
    text: "text-white",
    swatch: "bg-gray-400"
  },
};

export const TIMELINE_COLOR_KEYS = Object.keys(TIMELINE_COLORS) as TimelineColorKey[];

export function getCustomColorClasses(
  colorKey: string | null | undefined,
  variant: "initiative" | "task"
): { bg: string; hover: string; text: string } | null {
  if (!colorKey || !(colorKey in TIMELINE_COLORS)) {
    return null;
  }
  
  const config = TIMELINE_COLORS[colorKey as TimelineColorKey];
  
  // Tasks use slightly lighter versions of colors
  if (variant === "task") {
    return {
      bg: config.bg.replace("-500", "-400").replace("-400", "-300"),
      hover: config.hover.replace("-600", "-500").replace("-500", "-400"),
      text: config.text,
    };
  }
  
  return {
    bg: config.bg,
    hover: config.hover,
    text: config.text,
  };
}
