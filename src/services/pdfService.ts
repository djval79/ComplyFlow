import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
    title: string;
    subtitle?: string;
    organization: string;
    date: string;
    sections: ReportSection[];
    score?: number;
}

export interface ReportSection {
    title: string;
    content?: string;
    items?: { label: string; value: string; status?: 'pass' | 'fail' | 'warning' }[];
    table?: {
        headers: string[];
        rows: string[][];
    };
}

export const generateComplianceReport = (data: ReportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    // -- Header Band --
    doc.setFillColor(30, 64, 175); // Blue-800
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ComplyFlow', 20, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Compliance Audit Report', 20, 30);

    // -- Meta Data --
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(data.organization, pageWidth - 20, 20, { align: 'right' });
    doc.text(data.date, pageWidth - 20, 30, { align: 'right' });

    yPos = 55;

    // -- Title Section --
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, 20, yPos);
    yPos += 10;

    if (data.subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.setFont('helvetica', 'normal');
        doc.text(data.subtitle, 20, yPos);
        yPos += 15;
    }

    // -- Overview Score (if present) --
    if (data.score !== undefined) {
        yPos += 5;
        const scoreColor = data.score >= 80 ? [22, 163, 74] : data.score >= 60 ? [234, 179, 8] : [220, 38, 38];
        doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text('Overall Compliance Score', 30, yPos + 16);

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(`${data.score}%`, pageWidth - 30, yPos + 16, { align: 'right' });
        yPos += 35;
    }

    // -- Sections --
    data.sections.forEach((section) => {
        // Page break check (approximate)
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 30;
        }

        // Section Title
        doc.setFillColor(241, 245, 249); // Slate-100
        doc.rect(20, yPos, pageWidth - 40, 10, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(section.title, 25, yPos + 7);
        yPos += 18;

        // Free text content
        if (section.content) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(51, 65, 85);

            const splitText = doc.splitTextToSize(section.content, pageWidth - 40);
            doc.text(splitText, 20, yPos);
            yPos += (splitText.length * 5) + 5;
        }

        // Key-Value Items
        if (section.items) {
            section.items.forEach(item => {
                if (yPos > pageHeight - 20) { doc.addPage(); yPos = 30; }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text(item.label + ':', 20, yPos);

                doc.setFont('helvetica', 'normal');
                const valueX = 80;
                doc.text(item.value, valueX, yPos);

                if (item.status) {
                    const badgeX = pageWidth - 40;
                    let badgeColor = [100, 116, 139];
                    if (item.status === 'pass') badgeColor = [22, 163, 74];
                    if (item.status === 'fail') badgeColor = [220, 38, 38];
                    if (item.status === 'warning') badgeColor = [202, 138, 4];

                    doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
                    doc.setFont('helvetica', 'bold');
                    doc.text(item.status.toUpperCase(), badgeX, yPos);
                    doc.setTextColor(51, 65, 85); // Reset text
                }

                yPos += 8;
            });
            yPos += 5;
        }

        // Tables
        if (section.table) {
            autoTable(doc, {
                startY: yPos,
                head: [section.table.headers],
                body: section.table.rows,
                theme: 'grid',
                headStyles: { fillColor: [51, 65, 85] },
                styles: { fontSize: 9 },
                margin: { left: 20, right: 20 },
                didDrawPage: (data) => {
                    if (data.cursor) {
                        yPos = data.cursor.y + 10;
                    }
                }
            });
            // Updating yPos after table is tricky as autoTable handles page breaks
            // The didDrawPage hook helps hint where we ended up, but for simplicity
            // we'll rely on the finalY (which we need to grab from the last call state if multiple tables or sections)
            // JS PDF Autotable usually returns or sets doc.lastAutoTable.finalY
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }
    });

    // Footer for all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} | Generated by ComplyFlow`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`ComplyFlow_Report_${data.date}.pdf`);
};
