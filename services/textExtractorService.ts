import { ExtractedData } from "../types";

export const extractDataFromText = async (
  file: File,
  patterns: string
): Promise<ExtractedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length === 0) {
          reject(new Error("Empty file"));
          return;
        }

        // Parse the patterns from the user input
        const patternMap = parsePatterns(patterns);
        const extractedData: ExtractedData = [];

        lines.forEach((line, index) => {
          const row: Record<string, string> = {};
          let foundData = false;

          // Apply each pattern to the line
          Object.entries(patternMap).forEach(([key, regex]) => {
            const match = line.match(regex);
            if (match) {
              row[key] = match[1] || match[0];
              foundData = true;
            }
          });

          // Only add row if we found some data
          if (foundData) {
            row["line_number"] = (index + 1).toString();
            row["raw_text"] = line;
            extractedData.push(row);
          }
        });

        resolve(extractedData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const parsePatterns = (patternString: string): Record<string, RegExp> => {
  const patterns: Record<string, RegExp> = {};

  // Split by lines and parse each pattern
  const lines = patternString.split("\n").filter((line) => line.trim());

  lines.forEach((line) => {
    const [fieldName, pattern] = line.split(":").map((s) => s.trim());
    if (fieldName && pattern) {
      try {
        patterns[fieldName] = new RegExp(pattern, "i");
      } catch (error) {
        console.warn(`Invalid regex pattern for ${fieldName}: ${pattern}`);
      }
    }
  });

  // If no patterns were parsed, use some default ones
  if (Object.keys(patterns).length === 0) {
    patterns["text"] = /(.+)/;
  }

  return patterns;
};

export const extractDataFromCsv = async (
  file: File
): Promise<ExtractedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length === 0) {
          reject(new Error("Empty CSV file"));
          return;
        }

        // Parse headers
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/"/g, ""));

        // Parse data rows
        const data: ExtractedData = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
            .split(",")
            .map((v) => v.trim().replace(/"/g, ""));
          const row: Record<string, string> = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          data.push(row);
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
