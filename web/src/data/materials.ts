export type MaterialType =
  | "docs"
  | "pdf"
  | "pptx"
  | "docx"
  | "xlsx"
  | "zip"
  | "link"
  | "github"
  | "video";

export type Material = {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  size?: string;
  href: string;
};

export type MaterialGroup = {
  day: string;
  date: string;
  materials: Material[];
};

/*
 * Add real workshop files to web/public/materials/day-X/
 * and add their metadata here.
 *
 * Example PDF:
 * {
 *   id: 'git-slides',
 *   title: 'Git & GitHub Slides',
 *   type: 'pdf',
 *   size: '3.2 MB',
 *   href: '/materials/day-1/git-github-slides.pdf',
 * }
 */
export const materialGroups: MaterialGroup[] = [
  {
    day: "Day 1",
    date: "Saturday, 19 September 2026",
    materials: [
      {
        id: "introduction",
        title: "SomNOG 9 - Track Introduction",
        type: "pptx",
        href: "/materials/day-1/SomNOG-9-Track-Introduction.pptx",
      },
      {
        id: "schedule",
        title: "Schedule",
        description: "HTML and CSS notes with examples.",
        type: "docs",
        href: "/docs/day-1/schedule/",
      },
      {
        id: "groups",
        title: "Groups and responsibilities",
        // description: "Presentation used during the Git & GitHub session.",
        type: "xlsx",
        href: "/materials/day-1/Groups_and_responsibilities.xlsx",
      },
    ],
  },
  {
    day: "Day 2",
    date: "Sunday, 20 September 2026",
    materials: [],
  },
  {
    day: "Day 3",
    date: "Monday, 21 September 2026",
    materials: [],
  },
];
