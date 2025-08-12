// src/components/QueryForm.jsx
import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const QueryForm = ({ isLoading, setLoading }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const BACKEND_URL = 'http://localhost:3000';

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async () => {
    if (!query) {
      toast.error('Please enter a query.');
      return;
    }

    setLoading(true);
    setAnswer('');

    try {
      const response = await axios.post(`${BACKEND_URL}/query`, { query });
      setAnswer(response.data.answer);
      toast.success("Answer received!");
    } catch (error) {
      setAnswer('');
      toast.error(error.response?.data || 'Error querying data. Please upload a file first.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="write your query here"
        value={query}
        onChange={handleQueryChange}
        disabled={isLoading}
      />
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Get Answer'}
      </Button>
      {answer && (
        <div className="mt-4">
          <h3 className="font-semibold">Answer:</h3>
          <Textarea value={answer} readOnly rows={5} className="mt-2" />
        </div>
      )}
    </div>
  );
};

export default QueryForm;