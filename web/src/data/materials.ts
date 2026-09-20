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
        id: "schedule",
        title: "Schedule",
        description: "HTML and CSS notes with examples.",
        type: "docs",
        href: "/docs/day-1/schedule/",
      },
      {
        id: "introduction",
        title: "SomNOG 9 - Track Introduction",
        type: "pptx",
        href: "/materials/day-1/SomNOG-9-Track-Introduction.pptx",
      },
      {
        id: "groups",
        title: "Groups and responsibilities",
        // description: "Presentation used during the Git & GitHub session.",
        type: "xlsx",
        href: "/materials/day-1/Groups_and_responsibilities.xlsx",
      },
      {
        id: "microservices",
        title: "From Monolith to Microservices",
        type: "pdf",
        href: "/materials/day-1/From Monolith to Microservices.pdf",
      },
      {
        id: "nestjs",
        title: "Introduction to NestJS",
        type: "pdf",
        href: "/materials/day-1/Introduction to NestJS — SomNOG9.pdf",
      },
    ],
  },
  {
    day: "Day 2",
    date: "Sunday, 20 September 2026",
    materials: [
      {
        id: "next.js_slides",
        title: "Introduction to Next.js",
        type: "pptx",
        href: "/materials/day-2/SomNOG9_EMS_Presentation.pptx",
      },
      {
        id: "nextjs-setup",
        title: "Nextjs Setup Guide",
        type: "docs",
        href: "/docs/day-2/next.js-setup/",
      },
      {
        id: "microservices-setup",
        title: "Microservices setup using nest.js and prisma",
        type: "docs",
        href: "/docs/day-2/microservices-setup/",
      },
    ],
  },
  {
    day: "Day 3",
    date: "Monday, 21 September 2026",
    materials: [],
  },
];
