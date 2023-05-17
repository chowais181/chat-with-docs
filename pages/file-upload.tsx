import React, { ChangeEvent, useState } from 'react';
import Layout from '../components/layout';
import Link from 'next/link';
import { getCookie } from 'cookies-next';
import styles from '@/styles/Home.module.css';

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
      setError(null);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    try {
      setLoading(true);

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
      setSelectedFiles([]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setSelectedFiles([]);
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
            <br />
            <p>Selected files:</p>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
            <button onClick={handleUpload} disabled={loading}>
              Upload Files
            </button>
          </div>
        )}
        <br />
        {loading ? <h4>Loading ...</h4> : ''}
        <br />
        <div className={styles.center}>
          {message && (
            <div className="border border-green-400 rounded-md p-4 w-80 ">
              <p className="text-green-500">{message}</p>
            </div>
          )}
          {error && (
            <div className="border border-red-400 rounded-md p-4 w-80">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FileUpload;
export async function getServerSideProps(context: any) {
  const req = context.req;
  const res = context.res;
  const token = getCookie('token', { req, res });
  if (!token) {
    return {
      redirect: {
        permanent: false,
        destination: '/',
      },
    };
  }

  return {
    props: { token: token },
  };
}
