
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, File } from "lucide-react";

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }
    
    if (!documentType) {
      toast.error("Please select a document type");
      return;
    }
    
    setUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      toast.success("Document uploaded successfully");
      setUploading(false);
      setSelectedFile(null);
      setDocumentType("");
      setDescription("");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Insurance Document</CardTitle>
          <CardDescription>
            Upload your insurance documents securely to the portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType} required>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policy">Insurance Policy</SelectItem>
                  <SelectItem value="claim">Claim Form</SelectItem>
                  <SelectItem value="receipt">Payment Receipt</SelectItem>
                  <SelectItem value="certificate">Insurance Certificate</SelectItem>
                  <SelectItem value="other">Other Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upload File</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragActive ? "border-insurance-500 bg-insurance-50" : "border-gray-300"
                } ${selectedFile ? "bg-insurance-50" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  {selectedFile ? (
                    <>
                      <File className="h-12 w-12 text-insurance-500" />
                      <div>
                        <p className="font-medium text-insurance-700">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-12 w-12 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-600">
                          Drag and drop your file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports PDF, JPG, PNG (Max size: 10MB)
                        </p>
                      </div>
                    </>
                  )}
                  
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      id="file-input"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <span className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-insurance-600 hover:bg-insurance-700">
                      {selectedFile ? "Change File" : "Browse Files"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a brief description of the document"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-24"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={uploading || !selectedFile} 
                className="bg-insurance-600 hover:bg-insurance-700"
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;