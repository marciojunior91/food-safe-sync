// Client-side training certificate generator. Produces a landscape PDF for a
// completed enrollment using jsPDF (already a project dependency) — no storage
// round-trip required. Called from the Training Center Achievements tab.

import jsPDF from 'jspdf';
import { format } from 'date-fns';

export interface CertificateData {
  recipientName: string;
  courseTitle: string;
  organizationName: string;
  score: number | null;
  completedAt: string;     // ISO
  expiresAt?: string | null; // ISO date
}

export function generateCertificatePdf(d: CertificateData): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const center = pageWidth / 2;

  // Border
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(3);
  doc.rect(24, 24, pageWidth - 48, pageHeight - 48);
  doc.setLineWidth(1);
  doc.rect(34, 34, pageWidth - 68, pageHeight - 68);

  // Heading
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(34);
  doc.text('Certificate of Completion', center, 130, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.setFontSize(14);
  doc.text('This certifies that', center, 180, { align: 'center' });

  // Recipient
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20);
  doc.setFontSize(28);
  doc.text(d.recipientName, center, 220, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.setFontSize(14);
  doc.text('has successfully completed the course', center, 256, { align: 'center' });

  // Course
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20);
  doc.setFontSize(22);
  doc.text(d.courseTitle, center, 296, { align: 'center' });

  // Score
  if (d.score !== null) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(14);
    doc.text(`Final score: ${d.score}%`, center, 326, { align: 'center' });
  }

  // Footer line: org + dates
  doc.setTextColor(110);
  doc.setFontSize(11);
  const completed = format(new Date(d.completedAt), 'PPP');
  doc.text(`${d.organizationName}`, center, pageHeight - 96, { align: 'center' });
  doc.text(`Issued ${completed}`, center, pageHeight - 78, { align: 'center' });
  if (d.expiresAt) {
    doc.text(`Valid until ${format(new Date(d.expiresAt), 'PPP')}`, center, pageHeight - 60, { align: 'center' });
  }

  const safe = `${d.recipientName}-${d.courseTitle}`
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
  doc.save(`certificate-${safe}.pdf`);
}
