
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { File, Search as SearchIcon, Calendar, Download } from "lucide-react";
import { toast } from "sonner";

// Mock documents data for search results
const ALL_DOCUMENTS = [
  { id: "1", name: "Insurance_Policy_2023.pdf", type: "policy", date: "2023-10-15", description: "Annual health insurance policy document with coverage details" },
  { id: "2", name: "Claim_Form_Health.pdf", type: "claim", date: "2023-10-10", description: "Health claim form for dental procedure" },
  { id: "3", name: "Terms_and_Conditions.pdf", type: "policy", date: "2023-09-28", description: "Terms and conditions for insurance coverage" },
  { id: "4", name: "Vehicle_Insurance_Certificate.jpg", type: "certificate", date: "2023-09-20", description: "Certificate of insurance for Toyota Camry" },
  { id: "5", name: "Payment_Receipt_Q3.pdf", type: "receipt", date: "2023-09-15", description: "Receipt for Q3 insurance premium payment" },
  { id: "6", name: "Family_Health_Plan.pdf", type: "policy", date: "2023-09-05", description: "Family health insurance plan with dependent coverage details" },
  { id: "7", name: "Claim_Request_Auto.pdf", type: "claim", date: "2023-08-22", description: "Auto insurance claim for rear bumper damage" },
  { id: "8", name: "Home_Insurance_Policy.pdf", type: "policy", date: "2023-08-10", description: "Home insurance policy coverage for residential property" },
  { id: "9", name: "Travel_Insurance_Certificate.pdf", type: "certificate", date: "2023-07-28", description: "Travel insurance certificate for international travel" },
  { id: "10", name: "Accident_Claim_Form.pdf", type: "claim", date: "2023-07-15", description: "Personal accident claim form for workplace injury" },
  { id: "11", name: "Life_Insurance_Policy.pdf", type: "policy", date: "2023-06-30", description: "Term life insurance policy with beneficiary information" },
  { id: "12", name: "Premium_Payment_Receipt.pdf", type: "receipt", date: "2023-06-15", description: "Receipt for annual premium payment for life insurance" },
];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [documentType, setDocumentType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [searchResults, setSearchResults] = useState<typeof ALL_DOCUMENTS>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter documents based on search criteria
    const results = ALL_DOCUMENTS.filter(doc => {
      const matchesQuery = searchQuery 
        ? (doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      const matchesType = documentType === "all" || doc.type === documentType;
      
      let matchesDate = true;
      if (dateRange !== "all") {
        const docDate = new Date(doc.date);
        const currentDate = new Date();
        
        if (dateRange === "last30") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(currentDate.getDate() - 30);
          matchesDate = docDate >= thirtyDaysAgo;
        } else if (dateRange === "last90") {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(currentDate.getDate() - 90);
          matchesDate = docDate >= ninetyDaysAgo;
        } else if (dateRange === "last365") {
          const yearAgo = new Date();
          yearAgo.setFullYear(currentDate.getFullYear() - 1);
          matchesDate = docDate >= yearAgo;
        }
      }
      
      return matchesQuery && matchesType && matchesDate;
    });
    
    setSearchResults(results);
    setHasSearched(true);
    
    if (results.length === 0) {
      toast.info("No documents found matching your search criteria");
    } else {
      toast.success(`Found ${results.length} document(s)`);
    }
  };

  const handleDownload = (id: string, name: string) => {
    // In a real app, this would trigger a download
    toast.success(`Downloading ${name}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Documents</h1>
        <p className="text-gray-500 mt-1">Search through all your insurance documents</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search by keyword, document name, or description..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-1/4">
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="policy">Insurance Policies</SelectItem>
                    <SelectItem value="claim">Claim Forms</SelectItem>
                    <SelectItem value="receipt">Receipts</SelectItem>
                    <SelectItem value="certificate">Certificates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-1/4">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="last30">Last 30 Days</SelectItem>
                    <SelectItem value="last90">Last 90 Days</SelectItem>
                    <SelectItem value="last365">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" className="bg-insurance-600 hover:bg-insurance-700">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search Documents
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              Search Results {searchResults.length > 0 && `(${searchResults.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-insurance-100 rounded">
                        <File className="h-6 w-6 text-insurance-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="capitalize mr-4">{doc.type}</span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" /> {doc.date}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                          {doc.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.id, doc.name)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              hasSearched && (
                <div className="text-center py-8">
                  <SearchIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No documents found</h3>
                  <p className="text-gray-500 mt-1">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Search;