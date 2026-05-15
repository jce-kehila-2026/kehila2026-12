import EmojiObjectsOutlinedIcon from "@mui/icons-material/EmojiObjectsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import SelfImprovementOutlinedIcon from "@mui/icons-material/SelfImprovementOutlined";
import { SvgIcon } from "@mui/material";

/** Thin outline: vertical foot + toe marks (reflexology). */
export function ReflexologyFootOutlineIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11.2 3.2c.35-.15.75-.2 1.15-.15.55.1 1 .45 1.2.95.25.6.2 1.25-.05 1.85l-1.1 3.4-.55 4.55c-.15 1.25-.9 2.35-2 2.95-.45.25-.95.35-1.45.25-.9-.2-1.55-1-1.55-1.95V9.9c0-.55.1-1.1.35-1.6l1.15-2.45c.2-.45.25-.95.15-1.45-.1-.45-.45-.8-.9-.95" />
        <path d="M8.35 5.35c.2.05.4.2.45.45.1.35-.05.7-.3.95" />
        <path d="M9.55 4.15c.2.05.4.2.5.45.15.35 0 .75-.3 1" />
        <path d="M10.95 3.45c.2.08.38.22.48.42.18.35.12.78-.15 1.08" />
        <path d="M12.45 3.35c.22.05.4.2.5.42.2.38.12.85-.2 1.15" />
        <path d="M13.85 3.85c.2.12.35.3.42.52.15.4-.02.85-.38 1.08" />
      </g>
    </SvgIcon>
  );
}

/** Thin outline: two hands (massage). */
export function MassageHandsOutlineIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.2 20.2V11.5c0-.55-.2-1.05-.55-1.45-.35-.4-.85-.65-1.4-.65-.5 0-.95.2-1.3.55-.35.35-.55.85-.55 1.4v6.35" />
        <path d="M6.5 17.2v-5.1c0-.45-.15-.85-.45-1.15-.3-.3-.7-.45-1.15-.45-.4 0-.75.15-1.05.4-.3.3-.45.65-.45 1.05v5.25" />
        <path d="M13.8 20.2V11.5c0-.55.2-1.05.55-1.45.35-.4.85-.65 1.4-.65.5 0 .95.2 1.3.55.35.35.55.85.55 1.4v6.35" />
        <path d="M17.5 17.2v-5.1c0-.45.15-.85.45-1.15.3-.3.7-.45 1.15-.45.4 0 .75.15 1.05.4.3.3.45.65.45 1.05v5.25" />
        <path d="M8.35 9.85c.35-.85.95-1.55 1.75-2 .45-.25.95-.4 1.45-.4h.9c.5 0 1 .15 1.45.4.8.45 1.4 1.15 1.75 2" />
      </g>
    </SvgIcon>
  );
}

/** Thin outline: single leaf + vein (herbal). */
export function HerbalSingleLeafOutlineIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 4c3.4 1 5.8 4 5.8 7.8 0 3.6-2.6 6.8-5.8 8.3-3.2-1.5-5.8-4.7-5.8-8.3 0-3.8 2.4-6.8 5.8-7.8z" />
        <path d="M12 4v16.5" />
      </g>
    </SvgIcon>
  );
}

export const WELLNESS = {
  pageBg: "#FFF9FC",
  primary: "#B57BE8",
  lightPink: "#FCE4EC",
  card: "#ffffff",
  text: "#2d2640",
  muted: "#6b6280",
  radiusLg: "26px",
  radiusMd: "22px",
  shadowSoft: "0 10px 40px rgba(75, 19, 107, 0.06)",
  shadowCard: "0 8px 32px rgba(181, 123, 232, 0.08)",
  focusRing: "0 0 0 3px rgba(181, 123, 232, 0.35)",
};

export const WELLNESS_DARK = {
  pageBg: "linear-gradient(155deg, #0f172a 0%, #020617 50%, #0c1222 100%)",
  primary: "#c4a5f5",
  lightPink: "rgba(181, 123, 232, 0.12)",
  card: "#1e293b",
  text: "#f8fafc",
  muted: "#94a3b8",
  radiusLg: "26px",
  radiusMd: "22px",
  shadowSoft: "0 14px 40px rgba(0,0,0,0.35)",
  shadowCard: "0 12px 36px rgba(0,0,0,0.28)",
  focusRing: "0 0 0 3px rgba(196, 165, 245, 0.35)",
};

/** Booking grid + “My appointments” row icon lookup by saved appointment type label. */
export const APPOINTMENT_TYPE_OPTIONS = [
  {
    key: "psychologist",
    label: "Psychologist",
    match: ["psychologist"],
    Icon: PsychologyOutlinedIcon,
    description: "Private sessions with a licensed psychologist for emotional wellbeing.",
    durationMins: 50,
    iconBg: "rgba(181, 123, 232, 0.18)",
    iconColor: "#9d5bd6",
  },
  {
    key: "therapist",
    label: "Therapist",
    match: ["therapist"],
    Icon: PersonOutlineOutlinedIcon,
    description: "One-on-one talk therapy in a calm, confidential space.",
    durationMins: 50,
    iconBg: "rgba(181, 123, 232, 0.14)",
    iconColor: "#B57BE8",
  },
  {
    key: "reflexology",
    label: "Reflexology",
    match: ["reflexology"],
    Icon: ReflexologyFootOutlineIcon,
    description: "Gentle pressure-point work to support relaxation and balance.",
    durationMins: 45,
    iconBg: "rgba(34, 197, 94, 0.12)",
    iconColor: "#22a36b",
  },
  {
    key: "acupuncture",
    label: "Acupuncture & Herbal Medicine",
    match: ["acupuncture", "herbal"],
    Icon: HerbalSingleLeafOutlineIcon,
    description: "Holistic care combining acupuncture and natural herbal support.",
    durationMins: 60,
    iconBg: "rgba(34, 197, 94, 0.1)",
    iconColor: "#15803d",
  },
  {
    key: "massage",
    label: "Massage Therapy",
    match: ["massage"],
    Icon: MassageHandsOutlineIcon,
    description: "Therapeutic massage to ease tension and restore comfort.",
    durationMins: 60,
    iconBg: "rgba(251, 146, 60, 0.14)",
    iconColor: "#ea580c",
  },
  {
    key: "touchTherapy",
    label: "Touch Therapy (NLP / Touch)",
    match: ["touch therapy", "nlp / touch", "touch therapy (nlp"],
    Icon: SelfImprovementOutlinedIcon,
    description: "Gentle touch-based support combined with NLP-informed guidance.",
    durationMins: 50,
    iconBg: "rgba(236, 72, 153, 0.12)",
    iconColor: "#db2777",
  },
  {
    key: "nlp",
    label: "NLP",
    match: ["nlp"],
    Icon: EmojiObjectsOutlinedIcon,
    description: "Neuro-linguistic tools to support mindset and personal growth.",
    durationMins: 50,
    iconBg: "rgba(59, 130, 246, 0.12)",
    iconColor: "#2563eb",
  },
];

export function resolveAppointmentTypeOption(appointmentTypeLabel) {
  const s = (appointmentTypeLabel || "").toLowerCase();
  const found = APPOINTMENT_TYPE_OPTIONS.find((o) => o.match.some((m) => s.includes(m)));
  return found ?? APPOINTMENT_TYPE_OPTIONS[0];
}

/** Visual order for the booking type grid (matches product copy; NLP before Touch Therapy). */
export const BOOKING_TYPE_ORDER = [
  "psychologist",
  "therapist",
  "reflexology",
  "acupuncture",
  "massage",
  "nlp",
  "touchTherapy",
];

export function getSortedAppointmentTypeOptions() {
  return BOOKING_TYPE_ORDER.map((key) => APPOINTMENT_TYPE_OPTIONS.find((o) => o.key === key)).filter(Boolean);
}
