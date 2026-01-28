import { jsPDF } from "jspdf";

// Fallback education data
const DEFAULT_EDUCATION = [
  {
    id: 1,
    degree: "B.S.",
    fieldOfStudy: "Environmental Geoscience",
    institution: "Texas A&M University",
    endDate: "2006-05",
  },
];

type CareerPosition = {
  id: number | string;
  company: string;
  title: string;
  location: string;
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
  endDate?: string;
};

type ResumeData = {
  positions: CareerPosition[];
  skills: Skill[];
  education: EducationEntry[];
};

// Design constants
const COLORS = {
  primary: [14, 165, 233] as [number, number, number], // cyan-500
  black: [26, 26, 26] as [number, number, number],
  darkGray: [55, 55, 55] as [number, number, number],
  mediumGray: [90, 90, 90] as [number, number, number],
  lightGray: [130, 130, 130] as [number, number, number],
  ruleGray: [200, 200, 200] as [number, number, number],
};

const PAGE = {
  width: 210,
  height: 297,
  marginTop: 20,
  marginBottom: 18,
  marginLeft: 20,
  marginRight: 20,
};

const FONTS = {
  name: 28,
  title: 12,
  sectionHeader: 11,
  jobTitle: 11.5,
  company: 10.5,
  dates: 9.5,
  body: 10.5,
  small: 9.5,
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
  if (!endDate) return `${startYear} – Present`;
  const end = new Date(endDate);
  return `${startYear} – ${end.getFullYear()}`;
}

function groupSkillsByCategory(skills: Skill[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const skill of skills) {
    if (!grouped[skill.category]) grouped[skill.category] = [];
    grouped[skill.category].push(skill.name);
  }
  return grouped;
}

export function generateResumePDF(data: ResumeData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const contentWidth = PAGE.width - PAGE.marginLeft - PAGE.marginRight;
  let y = PAGE.marginTop;

  // === HEADER ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONTS.name);
  doc.setTextColor(...COLORS.black);
  doc.text("Ry Blaisdell", PAGE.marginLeft, y);

  // Contact info on same line, right-aligned
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONTS.small);
  doc.setTextColor(...COLORS.mediumGray);
  doc.text(
    "Bayfield, CO  ·  rylincoln@gmail.com",
    PAGE.width - PAGE.marginRight,
    y,
    { align: "right" }
  );
  y += 5;

  // Social links
  doc.text(
    "linkedin.com/in/ry-blaisdell  ·  github.com/rylincoln",
    PAGE.width - PAGE.marginRight,
    y,
    { align: "right" }
  );
  y += 6;

  // Title with accent line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONTS.title);
  doc.setTextColor(...COLORS.darkGray);
  doc.text("Technical Director & GIS/Software Leader", PAGE.marginLeft, y);

  // Accent line after title
  const titleWidth = doc.getTextWidth("Technical Director & GIS/Software Leader");
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.6);
  doc.line(PAGE.marginLeft, y + 2.5, PAGE.marginLeft + titleWidth, y + 2.5);
  y += 10;

  // === EXPERIENCE ===
  y = drawSectionHeader(doc, "Experience", y, contentWidth);

  for (let i = 0; i < data.positions.length; i++) {
    const position = data.positions[i];

    // Check for page break
    if (y > PAGE.height - 45) {
      doc.addPage();
      y = PAGE.marginTop;
    }

    // Job title and dates
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONTS.jobTitle);
    doc.setTextColor(...COLORS.black);
    doc.text(position.title, PAGE.marginLeft, y);

    doc.setFont("courier", "normal");
    doc.setFontSize(FONTS.dates);
    doc.setTextColor(...COLORS.lightGray);
    const dateStr = formatDateRange(position.startDate, position.endDate);
    doc.text(dateStr, PAGE.width - PAGE.marginRight, y, { align: "right" });
    y += 5.5;

    // Company and location
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONTS.company);
    doc.setTextColor(...COLORS.darkGray);
    doc.text(`${position.company}  ·  ${position.location}`, PAGE.marginLeft, y);
    y += 6;

    // Accomplishments
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONTS.body);
    doc.setTextColor(...COLORS.mediumGray);

    for (const accomplishment of position.accomplishments) {
      // Square bullet
      doc.setFillColor(...COLORS.primary);
      doc.rect(PAGE.marginLeft + 1, y - 2.5, 1.5, 1.5, "F");

      const lines = doc.splitTextToSize(accomplishment, contentWidth - 8);
      doc.text(lines, PAGE.marginLeft + 6, y);
      y += lines.length * 4.2;
    }

    // Space between positions
    if (i < data.positions.length - 1) {
      y += 4;
    }
  }

  y += 6;

  // === SKILLS ===
  // Check for page break
  if (y > PAGE.height - 60) {
    doc.addPage();
    y = PAGE.marginTop;
  }

  y = drawSectionHeader(doc, "Skills", y, contentWidth);

  const skillsByCategory = groupSkillsByCategory(data.skills);
  const skillsPerRow = 2;
  const colWidth = contentWidth / skillsPerRow;

  let rowY = y;

  // Calculate max height for each row to align columns properly
  const categoryData: { category: string; x: number; skillLines: string[]; row: number }[] = [];
  let currentCol = 0;
  let currentRow = 0;

  for (const category of categoryOrder) {
    if (!skillsByCategory[category]) continue;

    const x = PAGE.marginLeft + currentCol * colWidth;
    const skillText = skillsByCategory[category].join(", ");
    const skillLines = doc.splitTextToSize(skillText, colWidth - 10);

    categoryData.push({ category, x, skillLines, row: currentRow });

    currentCol++;
    if (currentCol >= skillsPerRow) {
      currentCol = 0;
      currentRow++;
    }
  }

  // Find max lines per row
  const rowMaxLines: number[] = [];
  for (const item of categoryData) {
    if (!rowMaxLines[item.row]) rowMaxLines[item.row] = 0;
    rowMaxLines[item.row] = Math.max(rowMaxLines[item.row], item.skillLines.length);
  }

  // Render skills with proper row heights
  let currentRowY = rowY;
  let lastRow = 0;

  for (const item of categoryData) {
    if (item.row !== lastRow) {
      currentRowY += 5 + rowMaxLines[lastRow] * 3.8 + 4;
      lastRow = item.row;
    }

    // Category name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONTS.small);
    doc.setTextColor(...COLORS.black);
    doc.text(categoryLabels[item.category], item.x, currentRowY);

    // Skills
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONTS.small);
    doc.setTextColor(...COLORS.mediumGray);
    doc.text(item.skillLines, item.x, currentRowY + 5);
  }

  // Calculate final y position
  rowY = currentRowY + 5 + rowMaxLines[lastRow] * 3.8;

  // Adjust y based on where we ended
  y = rowY + 6;

  // === EDUCATION ===
  // Check for page break
  if (y > PAGE.height - 35) {
    doc.addPage();
    y = PAGE.marginTop;
  }

  y = drawSectionHeader(doc, "Education", y, contentWidth);

  const educationEntries =
    data.education.length > 0 ? data.education : DEFAULT_EDUCATION;

  for (const entry of educationEntries) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONTS.body);
    doc.setTextColor(...COLORS.black);
    doc.text(`${entry.degree} ${entry.fieldOfStudy}`, PAGE.marginLeft, y);

    if (entry.endDate) {
      doc.setFont("courier", "normal");
      doc.setFontSize(FONTS.dates);
      doc.setTextColor(...COLORS.lightGray);
      doc.text(entry.endDate.split("-")[0], PAGE.width - PAGE.marginRight, y, {
        align: "right",
      });
    }
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONTS.company);
    doc.setTextColor(...COLORS.darkGray);
    doc.text(entry.institution, PAGE.marginLeft, y);
    y += 8;
  }

  // Save
  doc.save("ry-blaisdell-resume.pdf");
}

function drawSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  contentWidth: number
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONTS.sectionHeader);
  doc.setTextColor(...COLORS.black);
  doc.text(title.toUpperCase(), PAGE.marginLeft, y);

  // Line across full width
  const textWidth = doc.getTextWidth(title.toUpperCase());
  doc.setDrawColor(...COLORS.ruleGray);
  doc.setLineWidth(0.25);
  doc.line(
    PAGE.marginLeft + textWidth + 4,
    y - 1.5,
    PAGE.marginLeft + contentWidth,
    y - 1.5
  );

  return y + 7;
}
