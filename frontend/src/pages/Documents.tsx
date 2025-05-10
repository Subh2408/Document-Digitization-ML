
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { File, Download, Search, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Sample document data
const DOCUMENTS = [
  { 
    id: "1", 
    name: "Insurance_Policy_2023.pdf", 
    type: "policy",
    uploadedAt: "2023-10-15", 
    size: "1.2 MB" 
  },
  { 
    id: "2", 
    name: "Claim_Form_Health.pdf", 
    type: "claim",
    uploadedAt: "2023-10-10", 
    size: "0.8 MB" 
  },
  { 
    id: "3", 
    name: "Terms_and_Conditions.pdf", 
    type: "policy",
    uploadedAt: "2023-09-28", 
    size: "1.5 MB" 
  },
  { 
    id: "4", 
    name: "Vehicle_Insurance_Certificate.jpg", 
    type: "certificate",
    uploadedAt: "2023-09-20", 
    size: "2.1 MB" 
  },
  { 
    id: "5", 
    name: "Payment_Receipt_Q3.pdf", 
    type: "receipt",
    uploadedAt: "2023-09-15", 
    size: "0.5 MB" 
  },
  { 
    id: "6", 
    name: "Family_Health_Plan.pdf", 
    type: "policy",
    uploadedAt: "2023-09-05", 
    size: "3.2 MB" 
  },
  { 
    id: "7", 
    name: "Claim_Request_Auto.pdf", 
    type: "claim",
    uploadedAt: "2023-08-22", 
    size: "1.0 MB" 
  },
  { 
    id: "8", 
    name: "Home_Insurance_Policy.pdf", 
    type: "policy",
    uploadedAt: "2023-08-10", 
    size: "2.8 MB" 
  },
];

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const handleDownload = (documentId: string, name: string) => {
    // In a real app, this would trigger a download
    toast.success(`Downloading ${name}`);
  };

  const handleView = (documentId: string, name: string) => {
    // In a real app, this would open the document
    toast.info(`Viewing ${name}`);
  };

  // Filter documents based on search and type
  const filteredDocuments = DOCUMENTS.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <Link to="/upload">
          <Button className="bg-insurance-600 hover:bg-insurance-700">
            Upload New Document
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-2/3 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search documents..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-1/3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="policy">Insurance Policies</SelectItem>
                  <SelectItem value="claim">Claim Forms</SelectItem>
                  <SelectItem value="receipt">Receipts</SelectItem>
                  <SelectItem value="certificate">Certificates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Document Name</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Size</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <File className="h-5 w-5 mr-2 text-insurance-500" />
                          <span className="truncate max-w-[200px]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">{doc.type}</td>
                      <td className="py-3 px-4">{doc.uploadedAt}</td>
                      <td className="py-3 px-4">{doc.size}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleView(doc.id, doc.name)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownload(doc.id, doc.name)}
                          >
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No documents found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;
