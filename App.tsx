import React, { useState, useCallback, useMemo } from "react";
import {
  extractDataFromText,
  extractDataFromCsv,
} from "./services/textExtractorService";
import { exportToCsv, exportToXlsx, exportToWord } from "./utils/fileExporter";
import { ExtractedData } from "./types";
import {
  CsvIcon,
  ExcelIcon,
  WordIcon,
  UploadIcon,
  WandIcon,
  TrashIcon,
  FileIcon,
  ErrorIcon,
} from "./components/Icons";
import { Loader } from "./components/Loader";

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>(
    "Extract item, quantity, and price for each line item."
  );
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // 20MB limit
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError("File size exceeds 20MB. Please choose a smaller file.");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
    }
  };

  const handleExtract = useCallback(async () => {
    if (!file || !prompt) {
      setError("Please select a file and provide extraction instructions.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      let data: ExtractedData;

      // Check if it's a CSV file
      if (file.name.toLowerCase().endsWith(".csv")) {
        data = await extractDataFromCsv(file);
      } else {
        // Use text extraction with patterns
        data = await extractDataFromText(file, prompt);
      }

      if (data.length === 0) {
        setError(
          "No data could be extracted. Please check your file format or try different patterns."
        );
      } else {
        setExtractedData(data);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during extraction."
      );
    } finally {
      setIsLoading(false);
    }
  }, [file, prompt]);

  const handleReset = () => {
    setFile(null);
    setPrompt("Extract item, quantity, and price for each line item.");
    setExtractedData(null);
    setError(null);
    setIsLoading(false);
    // Reset the file input visually
    const fileInput = document.getElementById(
      "file-upload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const tableHeaders = useMemo(() => {
    if (!extractedData || extractedData.length === 0) return [];
    return Object.keys(extractedData[0]);
  }, [extractedData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
            Data Extractor Pro
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Transform documents into structured data with pattern matching.
          </p>
        </header>

        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg p-6 md:p-8 border border-slate-200 dark:border-slate-700">
          {!extractedData && !isLoading && (
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="file-upload"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  1. Upload a PDF or Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md transition hover:border-indigo-500 dark:hover:border-indigo-400">
                  <div className="space-y-1 text-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 dark:text-slate-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-800 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".txt,.csv,text/plain,application/pdf,image/jpeg,image/png,image/webp"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      TXT, CSV, PDF, PNG, JPG, WEBP up to 20MB
                    </p>
                  </div>
                </div>
                {file && (
                  <div className="mt-4 flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                    <FileIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2" />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {file.name}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  2. Describe the data to extract
                </label>
                <textarea
                  id="prompt"
                  rows={3}
                  className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., name: ([A-Z][a-z]+ [A-Z][a-z]+)&#10;email: ([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})&#10;phone: (\d{3}-\d{3}-\d{4})"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExtract}
                  disabled={!file || !prompt}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  <WandIcon className="h-5 w-5" />
                  Extract Data
                </button>
              </div>
            </div>
          )}

          {isLoading && <Loader />}

          {error && !isLoading && (
            <div className="text-center p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-600 rounded-lg">
              <ErrorIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-700 dark:text-red-300 font-semibold">
                Extraction Failed
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                {error}
              </p>
              <button
                onClick={handleReset}
                className="mt-4 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {extractedData && !isLoading && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  Extracted Data
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToCsv(extractedData, "extracted_data")}
                    className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    <CsvIcon className="h-4 w-4" /> CSV
                  </button>
                  <button
                    onClick={() =>
                      exportToXlsx(extractedData, "extracted_data")
                    }
                    className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <ExcelIcon className="h-4 w-4" /> XLSX
                  </button>
                  <button
                    onClick={() =>
                      exportToWord(extractedData, "extracted_data")
                    }
                    className="flex items-center gap-2 bg-purple-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-purple-700 transition-colors text-sm"
                  >
                    <WordIcon className="h-4 w-4" /> Word
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:text-slate-300 dark:bg-slate-800">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th
                          key={header}
                          scope="col"
                          className="px-6 py-3 font-medium tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="bg-white dark:bg-slate-800/50 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        {tableHeaders.map((header) => (
                          <td
                            key={`${rowIndex}-${header}`}
                            className="px-6 py-4"
                          >
                            {String(row[header] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 mx-auto bg-slate-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-slate-600 transition"
                >
                  <TrashIcon className="h-4 w-4" /> Start Over
                </button>
              </div>
            </div>
          )}
        </div>
        <footer className="text-center mt-12 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Powered by pattern matching. No AI required - all processing is done
            locally.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
