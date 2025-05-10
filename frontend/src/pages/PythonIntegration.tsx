// frontend/src/pages/PythonIntegrationPage.tsx
import PythonIntegrationComponent from "@/components/PythonIntegration"; // Changed import name & no curly braces
// Use any name here (e.g., PythonIntegrationFeatures, PythonIntegrationDisplay)
// because it's a default import. I'm using PythonIntegrationComponent for clarity.

const PythonIntegrationPage = () => {
  return (
    <div className="space-y-6 p-4 md:p-6"> {/* Added some padding */}
      {/* Maybe a page title here if not in the component itself */}
      {/* <h1 className="text-2xl font-bold mb-4">Python Integration</h1> */}
      <PythonIntegrationComponent /> {/* Use the imported component */}
    </div>
  );
};

export default PythonIntegrationPage;