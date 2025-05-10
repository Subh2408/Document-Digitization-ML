import { useState } from 'react';
import { toast } from 'sonner'; // For user feedback

// Assuming your path alias '@/' points to 'src/'
// If usePythonApi.ts is in src/hooks, and this file is in src/pages
// the path would be '../hooks/usePythonApi'
// If this file is in src/components, path would be '../hooks/usePythonApi'
// Adjust the import path as per your actual file structure.
// The key is to correctly import the exported hooks.
import {
  useCheckBackendStatus,
  useProcessData,
  useProcessUploadedFile
} from '@/hooks/usePythonApi'; // MAKE SURE THIS PATH IS CORRECT

// Import UI components if you use a library like ShadCN/UI
// For simplicity, I'll use basic HTML elements for input/button here
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";


// Define interfaces for the data specific to this page if not already in usePythonApi.ts
// (These might already be in usePythonApi.ts if they are the defaults used by the hooks)
interface DataProcessingPayload {
  numbers: number[];
  operation: string;
}
interface DataProcessingResponse {
  result: number;
}
interface FileProcessingResponse {
  message: string;
  fileId?: string;
}
interface PythonBackendStatus {
  status: string;
  message: string;
}


const PythonIntegrationPage = () => {
  // 1. Backend Status Check
  const {
    data: statusData,
    isLoading: isStatusLoading,
    error: statusError,
    refetch: refetchStatus, // Function to manually re-trigger the query
  } = useCheckBackendStatus({
    // queryKey: ['customBackendStatusKey'], // Optional: override default query key if needed
    // enabled: false, // Set to true to fetch on mount, false to fetch manually via refetch
  });

  // 2. Data Processing Example (e.g., sum calculation)
  const [numbersInput, setNumbersInput] = useState<string>("1,2,3,4,5");
  const [operationInput, setOperationInput] = useState<string>("sum");
  const {
    mutate: processDataMutation, // Renaming 'mutate' for clarity if you have multiple mutations
    isLoading: isProcessingData,
    data: processedDataResult,
    error: processDataError,
  } = useProcessData(); // Hook returns { mutate, isLoading, data, error, ... }

  const handleDataProcessingSubmit = () => {
    const numbers = numbersInput.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
    if (numbers.length === 0) {
      toast.error("Please enter valid, comma-separated numbers.");
      return;
    }
    if (!operationInput.trim()) {
      toast.error("Please enter an operation (e.g., sum).");
      return;
    }
    processDataMutation({ numbers, operation: operationInput.trim() });
  };

  // 3. File Processing Example
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const {
    mutate: processFileMutation, // Renaming 'mutate'
    isLoading: isProcessingFile,
    data: fileProcessingResult,
    error: fileProcessingError,
  } = useProcessUploadedFile();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      toast.info(`File selected: ${event.target.files[0].name}`);
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileUploadSubmit = () => {
    if (selectedFile) {
      processFileMutation(selectedFile); // Pass the file to the mutation function
    } else {
      toast.error("No file selected. Please choose a file to upload.");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
      <h1 className="text-3xl font-bold text-center mb-10">Python Backend Integration Examples</h1>

      {/* Section 1: Backend Status */}
      <section className="p-6 bg-card shadow-lg rounded-lg border">
        <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Backend Status</h2>
        <button
          onClick={() => refetchStatus()}
          disabled={isStatusLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isStatusLoading ? 'Checking Connection...' : 'Check Connection'}
        </button>
        {isStatusLoading && <p className="mt-2 text-sm text-muted-foreground">Loading status...</p>}
        {statusError && <p className="mt-2 text-sm text-destructive">Error fetching status: {statusError.message}</p>}
        {statusData && (
          <div className="mt-4 p-3 bg-secondary text-secondary-foreground rounded">
            <p><strong>Status:</strong> {statusData.status}</p>
            <p><strong>Message:</strong> {statusData.message}</p>
          </div>
        )}
      </section>

      {/* Section 2: Data Processing */}
      <section className="p-6 bg-card shadow-lg rounded-lg border">
        <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Data Processing Example</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="numbers" className="block text-sm font-medium text-muted-foreground mb-1">
              Numbers (comma-separated):
            </label>
            <input
              id="numbers"
              type="text"
              value={numbersInput}
              onChange={(e) => setNumbersInput(e.target.value)}
              placeholder="e.g., 1,2,3,4,5"
              className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background"
            />
          </div>
          <div>
            <label htmlFor="operation" className="block text-sm font-medium text-muted-foreground mb-1">
              Operation:
            </label>
            <input
              id="operation"
              type="text"
              value={operationInput}
              onChange={(e) => setOperationInput(e.target.value)}
              placeholder="e.g., sum, multiply"
              className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background"
            />
          </div>
          <button
            onClick={handleDataProcessingSubmit}
            disabled={isProcessingData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isProcessingData ? 'Processing...' : 'Send Data to Python'}
          </button>
        </div>
        {isProcessingData && <p className="mt-2 text-sm text-muted-foreground">Sending data...</p>}
        {processDataError && <p className="mt-2 text-sm text-destructive">Processing error: {processDataError.message}</p>}
        {processedDataResult && (
          <div className="mt-4 p-3 bg-secondary text-secondary-foreground rounded">
            <p><strong>Result:</strong> {processedDataResult.result}</p>
          </div>
        )}
      </section>

      {/* Section 3: File Processing */}
      <section className="p-6 bg-card shadow-lg rounded-lg border">
        <h2 className="text-2xl font-semibold mb-4 text-card-foreground">File Processing Example</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="fileUpload" className="block text-sm font-medium text-muted-foreground mb-1">
              Upload a file:
            </label>
            <input
              id="fileUpload"
              type="file"
              onChange={handleFileChange}
              className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
          )}
          <button
            onClick={handleFileUploadSubmit}
            disabled={isProcessingFile || !selectedFile}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isProcessingFile ? 'Uploading & Processing...' : 'Upload and Process File'}
          </button>
        </div>
        {isProcessingFile && <p className="mt-2 text-sm text-muted-foreground">Processing file...</p>}
        {fileProcessingError && <p className="mt-2 text-sm text-destructive">File processing error: {fileProcessingError.message}</p>}
        {fileProcessingResult && (
          <div className="mt-4 p-3 bg-secondary text-secondary-foreground rounded">
            <p><strong>Message:</strong> {fileProcessingResult.message}</p>
            {fileProcessingResult.fileId && <p><strong>File ID:</strong> {fileProcessingResult.fileId}</p>}
          </div>
        )}
      </section>
    </div>
  );
};

export default PythonIntegrationPage;