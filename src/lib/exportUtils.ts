import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Custom helper to format any date into an elegant readable string safe from typescript failures
const formatDateString = (dateVal: any): string => {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  } catch (e) {
    return String(dateVal);
  }
};

// Generates and downloads a CSV file with robust column quoting and UTC/Excel compatibility (BOM)
export const exportToCSV = (title: string, headers: string[], rows: string[][]) => {
  // Add Unicode BOM character for Excel compatibility with international UTF-8 accents
  let csvContent = "\uFEFF";
  
  // Format headers
  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
  
  // Format rows
  rows.forEach(row => {
    const rowStr = row.map(cell => {
      const cellStr = cell === null || cell === undefined ? "" : String(cell);
      return `"${cellStr.replace(/"/g, '""')}"`;
    }).join(",");
    csvContent += rowStr + "\n";
  });
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_report_${dateStr}.csv`;
  
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generates and downloads a highly styled PDF document matching the premium branding
export const exportToPDF = (title: string, headers: string[], rows: string[][], description: string) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Cover Page or Header Details
  // Premium top banner border
  doc.setFillColor(37, 99, 235); // BatoTutariGito brand blue (#2563eb)
  doc.rect(0, 0, pageWidth, 8, "F");
  
  // Title (Branding)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("BatoTutariGito NGO", 14, 22);
  
  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Rubengera, Karongi District, Western Province, Rwanda", 14, 28);
  
  // Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235); // brand blue
  doc.text(title, 14, 40);
  
  // Report Meta info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const localDate = new Date().toLocaleString();
  doc.text(`Report Description: ${description}`, 14, 46, { maxWidth: pageWidth - 28 });
  doc.text(`Generated On: ${localDate} | Status: Official NGO Archive Record`, 14, 54);
  
  // Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 58, pageWidth - 14, 58);
  
  // Dynamic Autotable configuration
  autoTable(doc, {
    startY: 62,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: {
      fillColor: [37, 99, 235], // BatoTutariGito brand blue
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left"
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85] // slate-700
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    margin: { left: 14, right: 14 },
    styles: {
      overflow: "linebreak",
      cellPadding: 3
    },
    didDrawPage: (data: any) => {
      // Footer text on every page
      const pageCount = doc.internal.pages.length - 1;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} | BatoTutariGito Official Record System`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  });
  
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_report_${dateStr}.pdf`;
  doc.save(fileName);
};

// Orchestrates matching reports to accurate extraction and formatting
export const exportReportDataset = (
  type: string, 
  data: any[], 
  formatType: "csv" | "pdf"
) => {
  let reportTitle = "";
  let reportDescription = "";
  let headers: string[] = [];
  let rows: string[][] = [];

  const formatAddress = (obj: any): string => {
    const sec = obj.sector || obj.address?.sector || "";
    const cel = obj.cell || obj.address?.cell || "";
    const vil = obj.village || obj.address?.village || "";
    if (!sec && !cel && !vil) return "N/A";
    return [sec, cel, vil].filter(Boolean).join(", ");
  };

  switch (type) {
    case "students":
      reportTitle = "Active Sponsored Students Report";
      reportDescription = "Comprehensive list of currently enrolled and active student beneficiaries of BatoTutariGito educational sponsorships.";
      headers = ["Student Name", "Email Address", "Telephone", "Gender", "Department", "Academic Level", "Start Date", "End Date", "Address (Sector/Cell/Village)"];
      rows = data.map(s => [
        s.name || "",
        s.email || "",
        s.telephone || "N/A",
        s.gender || "N/A",
        s.department || "N/A",
        s.level || "N/A",
        formatDateString(s.startDate),
        formatDateString(s.endDate),
        formatAddress(s)
      ]);
      break;

    case "graduated":
      reportTitle = "Graduates Achievement Records";
      reportDescription = "Official archive of graduate students who successfully completed their academic levels through Batotutarigito NGO funding.";
      headers = ["Graduate Name", "Email Address", "Telephone", "Gender", "Department", "Level Reached", "Start Date", "Completion Date", "Address (Sector/Cell/Village)"];
      rows = data.map(g => [
        g.name || "",
        g.email || "",
        g.telephone || "N/A",
        g.gender || "N/A",
        g.department || "N/A",
        g.level || "N/A",
        formatDateString(g.startDate),
        formatDateString(g.endDate),
        formatAddress(g)
      ]);
      break;

    case "community":
    case "families":
      reportTitle = "NGO Registered Beneficiary Families";
      reportDescription = "Registered local households and communities receiving active socio-economic support, agricultural sponsorships, and cow-replications.";
      headers = ["Username / Family Name", "Telephone", "Sector", "Cell", "Village"];
      rows = data.map(f => [
        f.username || f.name || "N/A",
        f.telephone || "N/A",
        f.sector || f.address?.sector || "N/A",
        f.cell || f.address?.cell || "N/A",
        f.village || f.address?.village || "N/A"
      ]);
      break;

    case "cows":
      reportTitle = "Cattle Projects and Livestock Assets";
      reportDescription = "Detailed cow distribution auditing ledger tracking animal tags, health spending, original source, and overall cow replication indicators.";
      headers = ["Date Cow was Given", "Purchase Price (RWF)", "Cow Number (TAG)", "Source Family"];
      rows = data.map(c => [
        formatDateString(c.dateReceived),
        c.purchaseAmount ? Number(c.purchaseAmount).toLocaleString() : "0",
        c.cowNumber || "N/A",
        c.family?.name || "None"
      ]);
      break;

    case "calves":
      reportTitle = "Calf Pass-On Replication History";
      reportDescription = "Auditing records tracking newborn calves passed on from pilot beneficiary families (Donor) to new vulnerable families (Recipient).";
      headers = ["Origin Cow (TAG)", "From Family", "New Destination Family", "Transfer Date"];
      rows = data.map(c => [
        c.cow?.cowNumber || c.cowId || "N/A",
        c.fromFamily?.name || "N/A",
        c.toFamily?.name || "N/A",
        formatDateString(c.transferDate || c.createdAt)
      ]);
      break;

    case "shares":
      reportTitle = "Social Investment Shares Ledger";
      reportDescription = "Asset ledger storing investment shares distributed to students and graduates to establish community capital and seed investments.";
      headers = ["Assignment Recipient (Student/Graduate)", "Share Amount (RWF)", "Issue Date", "Expiry Date (3 Year Standard)"];
      rows = data.map(sh => [
        sh.userName || "N/A",
        sh.amount ? Number(sh.amount).toLocaleString() : "0",
        formatDateString(sh.shareDate),
        formatDateString(sh.expiryDate)
      ]);
      break;

    case "expenses":
      reportTitle = "Cattle Management Operations Expenses";
      reportDescription = "Audit ledger displaying daily veterinarian visits, medical treatments, feeding, housing maintenance, and general cattle costs.";
      headers = ["Cow Tag / Number", "Expense Type", "Expense Amount (RWF)", "Date Incurred"];
      rows = data.map(e => [
        e.cowNumber || "N/A",
        e.type || "N/A",
        e.amount ? Number(e.amount).toLocaleString() : "0",
        formatDateString(e.date || e.createdAt)
      ]);
      break;

    case "sponsorship":
    case "support":
      reportTitle = "Sponsorship Deliveries & Support Logs";
      reportDescription = "List of community-based and direct personal sponsorships, including distribution of cows, goats, foods, money, and materials in Karongi.";
      headers = ["Beneficiary Name", "Telephone", "Distribution Address / Location", "Support Dispatched Date", "Dispatched Asset Type"];
      rows = data.map(s => [
        s.beneficiaryName || "N/A",
        s.telephone || "N/A",
        s.address || "N/A",
        formatDateString(s.date || s.createdAt),
        s.supportType || "N/A"
      ]);
      break;

    default:
      console.error("Unknown report type:", type);
      return;
  }

  if (formatType === "csv") {
    exportToCSV(reportTitle, headers, rows);
  } else {
    exportToPDF(reportTitle, headers, rows, reportDescription);
  }
};
