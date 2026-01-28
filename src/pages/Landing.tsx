import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Mail, Linkedin, Github, MapPin, Calendar, Download } from "lucide-react";
import careerFallback from "@/data/career.json";
import skillsFallback from "@/data/skills.json";
import educationFallback from "@/data/education.json";
import { ExperienceTimeline } from "@/components/ui/experience-timeline";
import { SkillsChart } from "@/components/ui/skills-chart";
import { SectionConnector } from "@/components/ui/section-connector";
import { useGlobeFocus } from "@/contexts/globe-focus";
import { generateResumePDF } from "@/lib/resume-pdf";

type CareerPosition = {
  id: number | string;
  company: string;
  title: string;
  location: string;
  coordinates: [number, number];
  startDate: string;
  endDate: string | null;
  accomplishments: string[];
};

type Skill = {
  id: number | string;
  name: string;
  category: string;
};

type EducationEntry = {
  id: number;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  coordinates?: [number, number];
  accomplishments?: string[];
};

const categoryLabels: Record<string, string> = {
  "gis-spatial": "GIS/Spatial",
  "cloud-infrastructure": "Cloud/Infrastructure",
  "data-platforms": "Data Platforms",
  "app-delivery": "App Delivery",
  leadership: "Leadership",
};

const categoryOrder = [
  "gis-spatial",
  "cloud-infrastructure",
  "data-platforms",
  "app-delivery",
  "leadership",
];

function formatDateRange(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  const startYear = start.getFullYear();

  if (!endDate) {
    return `${startYear}–Present`;
  }

  const end = new Date(endDate);
  const endYear = end.getFullYear();

  return `${startYear}–${endYear}`;
}

function groupSkillsByCategory(skills: Skill[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const skill of skills) {
    if (!grouped[skill.category]) {
      grouped[skill.category] = [];
    }
    grouped[skill.category].push(skill.name);
  }

  return grouped;
}

async function fetchCareer(): Promise<CareerPosition[]> {
  const res = await fetch("/api/career");
  if (!res.ok) throw new Error("Failed to fetch career data");
  return res.json();
}

async function fetchSkills(): Promise<Skill[]> {
  const res = await fetch("/api/skills");
  if (!res.ok) throw new Error("Failed to fetch skills data");
  return res.json();
}

async function fetchEducation(): Promise<EducationEntry[]> {
  const res = await fetch("/api/education");
  if (!res.ok) throw new Error("Failed to fetch education data");
  return res.json();
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold pl-4 border-l-2 border-primary mb-8">
      {children}
    </h2>
  );
}

function SkillTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-sm px-2.5 py-1 border border-border rounded-sm bg-secondary/30 text-foreground/90">
      {children}
    </span>
  );
}

export default function Landing() {
  const { setFocus, clearFocus } = useGlobeFocus();

  const { data: careerData } = useQuery({
    queryKey: ["career"],
    queryFn: fetchCareer,
    placeholderData: careerFallback as unknown as CareerPosition[],
    staleTime: 5 * 60 * 1000,
  });

  const { data: skillsData } = useQuery({
    queryKey: ["skills"],
    queryFn: fetchSkills,
    placeholderData: skillsFallback as Skill[],
    staleTime: 5 * 60 * 1000,
  });

  const { data: educationData } = useQuery({
    queryKey: ["education"],
    queryFn: fetchEducation,
    placeholderData: educationFallback as unknown as EducationEntry[],
    staleTime: 5 * 60 * 1000,
  });

  const positions = [...(careerData || [])].reverse();
  const skillsByCategory = groupSkillsByCategory(skillsData || []);

  const handlePositionHover = (position: CareerPosition) => {
    setFocus(position.coordinates, position.location);
  };

  const handlePositionLeave = () => {
    clearFocus();
  };

  // Prepare skills chart data
  const skillsChartData = categoryOrder
    .filter((cat) => skillsByCategory[cat])
    .map((cat) => ({
      name: categoryLabels[cat],
      count: skillsByCategory[cat].length,
    }));

  const handleDownloadPDF = () => {
    generateResumePDF({
      positions,
      skills: skillsData || [],
      education: educationData || [],
    });
  };

  return (
    <div className="container max-w-3xl py-16 md:py-20 px-6">
      {/* Download PDF Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-mono text-muted-foreground border border-border rounded hover:border-primary hover:text-primary transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Resume
        </button>
      </div>

      {/* Name & Title */}
      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Ry Blaisdell
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light mb-6">
          Technical Director & GIS/Software Leader
        </p>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          20+ years building geospatial and data-driven systems. I bridge
          technical implementation and business strategy, turning complex
          spatial and operational challenges into reliable platforms that teams
          trust and clients value.
        </p>
      </header>

      <SectionConnector />

      {/* Experience */}
      <section className="mb-16">
        <SectionHeader>Experience</SectionHeader>
        <div className="relative pl-8">
          <ExperienceTimeline positions={positions.length} />
          <div className="space-y-10">
            {positions.map((position) => (
              <article
                key={position.id}
                onMouseEnter={() => handlePositionHover(position)}
                onMouseLeave={handlePositionLeave}
                className="cursor-default transition-opacity duration-300 hover:opacity-100 group"
              >
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {position.title}
                  </h3>
                  <p className="text-foreground/80">{position.company}</p>
                  <div className="flex items-center gap-4 mt-1.5 font-mono text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateRange(position.startDate, position.endDate)}
                    </span>
                    <span className="flex items-center gap-1.5 group-hover:text-accent transition-colors">
                      <MapPin className="w-3.5 h-3.5" />
                      {position.location}
                    </span>
                  </div>
                </div>
                <ul className="list-disc list-outside ml-5 space-y-1.5 text-muted-foreground">
                  {position.accomplishments.map((accomplishment) => (
                    <li key={accomplishment} className="pl-1">
                      {accomplishment}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SectionConnector />

      {/* Skills */}
      <section className="mb-16">
        <SectionHeader>Skills</SectionHeader>
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            {categoryOrder.map(
              (category) =>
                skillsByCategory[category] && (
                  <div key={category}>
                    <span className="font-mono text-sm text-muted-foreground block mb-2.5">
                      {categoryLabels[category]}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {skillsByCategory[category].map((skill) => (
                        <SkillTag key={skill}>{skill}</SkillTag>
                      ))}
                    </div>
                  </div>
                ),
            )}
          </div>
          <div className="hidden md:block">
            <SkillsChart categories={skillsChartData} />
          </div>
        </div>
      </section>

      <SectionConnector />

      {/* Education */}
      <section className="mb-16">
        <SectionHeader>Education</SectionHeader>
        <div className="space-y-6">
          {(educationData || []).map((entry) => (
            <article
              key={entry.id}
              onMouseEnter={() =>
                entry.coordinates &&
                setFocus(entry.coordinates, entry.institution)
              }
              onMouseLeave={handlePositionLeave}
              className="cursor-default"
            >
              <p className="text-lg font-semibold">
                {entry.degree} {entry.fieldOfStudy}
              </p>
              <div className="flex items-center gap-4 mt-1 font-mono text-sm text-muted-foreground">
                <span>{entry.institution}</span>
                {entry.endDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {entry.endDate.split("-")[0]}
                  </span>
                )}
                {entry.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {entry.location}
                  </span>
                )}
              </div>
              {entry.gpa && (
                <p className="text-sm text-muted-foreground mt-1">
                  GPA: {entry.gpa}
                </p>
              )}
              {entry.accomplishments && entry.accomplishments.length > 0 && (
                <ul className="list-disc list-outside ml-5 space-y-1 mt-2 text-muted-foreground">
                  {entry.accomplishments.map((a) => (
                    <li key={a} className="pl-1">
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <SectionConnector />

      {/* Contact */}
      <section>
        <SectionHeader>Contact</SectionHeader>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Link
            to="/contact"
            className="group flex items-center gap-2 text-primary hover:underline underline-offset-4"
          >
            <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-mono text-sm text-muted-foreground group-hover:text-primary transition-colors">
              Get in touch
            </span>
          </Link>
          <a
            href="https://www.linkedin.com/in/ry-blaisdell-342977281/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-primary hover:underline underline-offset-4"
          >
            <Linkedin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-mono text-sm text-muted-foreground group-hover:text-primary transition-colors">
              linkedin
            </span>
          </a>
          <a
            href="https://github.com/rylincoln"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-primary hover:underline underline-offset-4"
          >
            <Github className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-mono text-sm text-muted-foreground group-hover:text-primary transition-colors">
              github
            </span>
          </a>
        </div>
      </section>

    </div>
  );
}
