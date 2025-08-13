// src/components/UploadForm.jsx
import { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const UploadForm = ({ onFileRead, setLoading }) => {
  const [file, setFile] = useState(null);
  const BACKEND_URL = 'http://localhost:3000';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;

        const workbook = XLSX.read(data, { type: 'array' });

        const allSheetsData = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
          return { name: sheetName, data: jsonData };
        });

        onFileRead(allSheetsData);
        toast.success("File loaded successfully!");
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file); // Directly append the original File object

    console.log("📤 Uploading to:", `${BACKEND_URL}/upload`);
    console.log("📄 File selected:", file);


    try {
      console.log('Uploading file:', file);
      const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Error uploading file. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input type="file" onChange={handleFileChange} />
      <Button onClick={handleUpload}>Upload</Button>
    </div>
  );
};

export default UploadForm;
