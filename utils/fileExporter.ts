import { ExtractedData, ExtractedRow } from "../types";

declare const XLSX: any; // Using script tag, so declare it globally for TypeScript

// Utility to create and trigger a download link
const download = (filename: string, data: Blob) => {
  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
};

/**
 * Exports data to a CSV file.
 * @param data - The array of objects to export.
 * @param filename - The desired filename without extension.
 */
export const exportToCsv = (data: ExtractedData, filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const escaped = ("" + row[header]).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  download(`${filename}.csv`, blob);
};

/**
 * Exports data to an XLSX file using SheetJS library.
 * @param data - The array of objects to export.
 * @param filename - The desired filename without extension.
 */
export const exportToXlsx = (data: ExtractedData, filename: string) => {
  if (data.length === 0) return;

  if (typeof XLSX === "undefined") {
    alert("XLSX library is not loaded. Cannot export to Excel.");
    console.error("SheetJS (XLSX) library not found on window object.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  // This function from the library handles the download directly
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Exports data to a Word document (DOCX) format.
 * @param data - The array of objects to export.
 * @param filename - The desired filename without extension.
 */
export const exportToWord = (data: ExtractedData, filename: string) => {
  if (data.length === 0) return;

  // Create Word document content in HTML format
  const headers = Object.keys(data[0]);

  let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Extracted Data</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                h1 { color: #333; }
                .header { margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Extracted Data Report</h1>
                <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Total Records:</strong> ${data.length}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        ${headers
                          .map((header) => `<th>${header}</th>`)
                          .join("")}
                    </tr>
                </thead>
                <tbody>
                    ${data
                      .map(
                        (row) => `
                        <tr>
                            ${headers
                              .map(
                                (header) =>
                                  `<td>${String(row[header] || "")}</td>`
                              )
                              .join("")}
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </body>
        </html>
    `;

  // Create a blob with the HTML content
  const blob = new Blob([htmlContent], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  // For better Word compatibility, we'll use a different approach
  // Create a rich text format that Word can open
  const rtfContent = createRTFContent(data, headers);
  const rtfBlob = new Blob([rtfContent], { type: "application/rtf" });

  download(`${filename}.rtf`, rtfBlob);
};

/**
 * Creates RTF content for Word compatibility
 */
const createRTFContent = (data: ExtractedData, headers: string[]): string => {
  let rtf = "{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}";
  rtf += "\\f0\\fs24";
  rtf += "\\b Extracted Data Report\\b0\\par";
  rtf += `Generated on: ${new Date().toLocaleString()}\\par`;
  rtf += `Total Records: ${data.length}\\par\\par`;

  // Create table-like structure
  rtf += "\\b Data:\\b0\\par\\par";

  data.forEach((row, index) => {
    rtf += `Record ${index + 1}:\\par`;
    headers.forEach((header) => {
      const value = String(row[header] || "");
      rtf += `  ${header}: ${value}\\par`;
    });
    rtf += "\\par";
  });

  rtf += "}";
  return rtf;
};
