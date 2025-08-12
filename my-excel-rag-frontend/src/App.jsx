// src/App.jsx
import { useState } from 'react';
import UploadForm from './components/UploadForm';
import QueryForm from './components/QueryForm';
import ExcelTable from './components/ExcelTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Toaster } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';

function App() {
  const [allSheets, setAllSheets] = useState([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleNextSheet = () => {
    setCurrentSheetIndex((prevIndex) => (prevIndex + 1) % allSheets.length);
  };

  const handlePreviousSheet = () => {
    setCurrentSheetIndex((prevIndex) => (prevIndex - 1 + allSheets.length) % allSheets.length);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-8 space-y-8">
      <h1 className="text-4xl font-extrabold text-gray-800">Excel RAG Application</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadForm
              onFileRead={(data) => {
                setAllSheets(data);
                setCurrentSheetIndex(0);
              }}
              setLoading={setLoading}
            />
             <div className="mt-4">
              <h4 className="text-lg font-semibold">Instructions:</h4>
              <p className="text-sm text-gray-600">
                Click one the choose file button,open the file you want display.
                <br />
                After uploading your file successfully,click on the upload button below.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Query Data</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryForm isLoading={loading} setLoading={setLoading} />
            <div className="mt-4">
              <h4 className="text-lg font-semibold">Instructions:</h4>
              <p className="text-sm text-gray-600">
                You can ask questions about the data in the Excel file. Try to be specific with dates and details.
                <br />
                Example: "give me information for august 10?"
                <br />
                Example: "give me reference link/theme/post format for august 10?"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {allSheets.length > 0 && (
        <Card className="w-full max-w-6xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Uploaded Data: Sheet "{allSheets[currentSheetIndex].name}"</CardTitle>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={handlePreviousSheet} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext onClick={handleNextSheet} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardHeader>
          <CardContent>
            <ExcelTable data={allSheets[currentSheetIndex].data} />
          </CardContent>
        </Card>
      )}
      
      {loading && (
        <div className="w-full max-w-md mt-4">
          <Progress value={loading ? 50 : 0} />
          <p className="text-center text-gray-500 mt-2">Processing your request...</p>
        </div>
      )}

      <Toaster />
    </div>
  );
}

export default App;
