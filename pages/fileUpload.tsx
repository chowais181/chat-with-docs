import React, { ChangeEvent, useState } from 'react';
import Layout from '../components/layout';
import Link from 'next/link';
const FileUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
    }
  };

  return (
    <Layout pageTitle="upload pdf">
      <Link href="/">Home</Link>
      <br />
      <div>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        {selectedFile && <p>Selected file: {selectedFile.name}</p>}
      </div>
    </Layout>
  );
};
export default FileUpload;
