
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { File, Upload, Search, Shield } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for recent documents
const RECENT_DOCUMENTS = [
  { id: "1", name: "Insurance_Policy_2023.pdf", type: "pdf", size: "1.2 MB", uploadedAt: "2023-10-15" },
  { id: "2", name: "Claim_Form_Health.pdf", type: "pdf", size: "0.8 MB", uploadedAt: "2023-10-10" },
  { id: "3", name: "Terms_and_Conditions.pdf", type: "pdf", size: "1.5 MB", uploadedAt: "2023-09-28" },
  { id: "4", name: "Vehicle_Insurance_Certificate.jpg", type: "image", size: "2.1 MB", uploadedAt: "2023-09-20" },
];

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    // Simulate fetching dashboard data
    setTotalDocuments(isAdmin ? 124 : 14);
    setPendingApprovals(isAdmin ? 7 : 0);
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Documents</CardTitle>
            <CardDescription>All your stored documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-insurance-600">{totalDocuments}</span>
              <File className="h-8 w-8 text-insurance-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Uploads</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-insurance-600">
                {isAdmin ? 23 : 4}
              </span>
              <Upload className="h-8 w-8 text-insurance-500" />
            </div>
          </CardContent>
        </Card>
        
        {isAdmin ? (
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending Approvals</CardTitle>
              <CardDescription>Documents awaiting review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-insurance-600">{pendingApprovals}</span>
                <Shield className="h-8 w-8 text-insurance-500" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Search</CardTitle>
              <CardDescription>Find your documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Link to="/search" className="text-insurance-600 hover:text-insurance-800 font-medium">
                  Search now
                </Link>
                <Search className="h-8 w-8 text-insurance-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/upload" 
                className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Upload className="h-8 w-8 mb-2 text-insurance-500" />
                <span className="text-sm font-medium">Upload Document</span>
              </Link>
              <Link 
                to="/documents" 
                className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <File className="h-8 w-8 mb-2 text-insurance-500" />
                <span className="text-sm font-medium">View Documents</span>
              </Link>
              <Link 
                to="/search" 
                className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Search className="h-8 w-8 mb-2 text-insurance-500" />
                <span className="text-sm font-medium">Search</span>
              </Link>
              <Link 
                to="/profile" 
                className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Shield className="h-8 w-8 mb-2 text-insurance-500" />
                <span className="text-sm font-medium">My Profile</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_DOCUMENTS.slice(0, 4).map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0">
                      <td className="py-2 flex items-center">
                        <File className="h-4 w-4 mr-2 text-insurance-500" />
                        <span className="truncate max-w-[150px]">{doc.name}</span>
                      </td>
                      <td className="py-2 text-gray-600">{doc.uploadedAt}</td>
                      <td className="py-2 text-gray-600">{doc.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-center">
                <Link to="/documents" className="text-insurance-600 hover:text-insurance-800 text-sm font-medium">
                  View all documents
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;