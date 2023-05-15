import React, { ChangeEvent, useState } from 'react';
import Layout from '../components/layout';
import Link from 'next/link';

const FileUpload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      setSelectedFiles(fileList);
    }
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append(`files`, file);
      });
      const response = await fetch('/api/ingest-data', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessage(data.message);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(
        'An error occurred while ingesting  the data. Please try again.',
      );
    }
  };

  return (
    <Layout pageTitle="Upload PDF">
      <Link href="/">Home</Link>
      <br />
      <div>
        <input type="file" accept=".pdf" multiple onChange={handleFileChange} />
        {selectedFiles.length > 0 && (
          <div>
            <p>Selected files:</p>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
            <button onClick={handleUpload}>Upload Files</button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FileUpload;
