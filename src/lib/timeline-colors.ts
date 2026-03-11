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
  taskBg: string;
  taskHover: string;
  text: string;
  swatch: string;
}

export const TIMELINE_COLORS: Record<TimelineColorKey, TimelineColorConfig> = {
  red: { bg: "bg-red-500", hover: "hover:bg-red-600", taskBg: "bg-red-400", taskHover: "hover:bg-red-500", text: "text-white", swatch: "bg-red-500" },
  orange: { bg: "bg-orange-500", hover: "hover:bg-orange-600", taskBg: "bg-orange-400", taskHover: "hover:bg-orange-500", text: "text-white", swatch: "bg-orange-500" },
  yellow: { bg: "bg-yellow-400", hover: "hover:bg-yellow-500", taskBg: "bg-yellow-300", taskHover: "hover:bg-yellow-400", text: "text-gray-900", swatch: "bg-yellow-400" },
  green: { bg: "bg-green-500", hover: "hover:bg-green-600", taskBg: "bg-green-400", taskHover: "hover:bg-green-500", text: "text-white", swatch: "bg-green-500" },
  teal: { bg: "bg-teal-500", hover: "hover:bg-teal-600", taskBg: "bg-teal-400", taskHover: "hover:bg-teal-500", text: "text-white", swatch: "bg-teal-500" },
  blue: { bg: "bg-blue-500", hover: "hover:bg-blue-600", taskBg: "bg-blue-400", taskHover: "hover:bg-blue-500", text: "text-white", swatch: "bg-blue-500" },
  purple: { bg: "bg-purple-500", hover: "hover:bg-purple-600", taskBg: "bg-purple-400", taskHover: "hover:bg-purple-500", text: "text-white", swatch: "bg-purple-500" },
  pink: { bg: "bg-pink-500", hover: "hover:bg-pink-600", taskBg: "bg-pink-400", taskHover: "hover:bg-pink-500", text: "text-white", swatch: "bg-pink-500" },
  gray: { bg: "bg-gray-400", hover: "hover:bg-gray-500", taskBg: "bg-gray-300", taskHover: "hover:bg-gray-400", text: "text-white", swatch: "bg-gray-400" },
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
  
  if (variant === "task") {
    return { bg: config.taskBg, hover: config.taskHover, text: config.text };
  }
  
  return { bg: config.bg, hover: config.hover, text: config.text };
}
