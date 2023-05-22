import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

let filePath = path.join(process.cwd(), 'docs');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const cookies = parse(req.headers.cookie || '');
    const token: any = cookies.token;
    const secret: any = process.env.NEXT_PUBLIC_SECRET_KEY;
    if (!token) {
      res.status(500).json({ error: 'Unable to fetch user data' });
      return;
    }
    // Verify the token
    const decodedToken: any = jwt.verify(token, secret);
    // Retrieve user data from the decoded token (assuming it contains the user object)
    const userId = decodedToken.id;

    const form = new formidable.IncomingForm({
      maxFiles: 5,
      maxFileSize: 1024 * 1024 * 10, // 10mb
      filename: (_name, _ext, part) => {
        const originalFileName: any = part.originalFilename || 'unknown';
        return originalFileName;
      },
      uploadDir: path.join(process.cwd(), 'docs'), // Set the upload directory
      keepExtensions: true, // Optional: Keep the original file extension
      multiples: true, // Allow multiple file uploads
    });

    form.parse(req, async (error, fields, files) => {
      if (error) {
        console.log('Error parsing form data', error);
        return res.status(400).json({ error: 'Failed to parse form data' });
      }

      /*load raw docs from the all files in the directory */
      const directoryLoader = new DirectoryLoader(filePath, {
        '.pdf': (path) => new CustomPDFLoader(path),
      });

      const rawDocs = await directoryLoader.load();

      /* Split text into chunks */
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const docs = await textSplitter.splitDocuments(rawDocs);

      console.log('creating vector store...');
      /*create and store the embeddings in the vectorStore*/
      const embeddings = new OpenAIEmbeddings();
      const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

      // Associate the user's ID with the document metadata
      const docsWithMetadata = docs.map((doc) => {
        const fileName = path.basename(doc.metadata.source);
        return {
          ...doc,
          metadata: {
            ...doc.metadata,
            userId: userId,
            fileName: fileName,
          },
        };
      });

      console.log('Docs with metadata: ', docsWithMetadata);

      //embed the PDF documents
      const result = await PineconeStore.fromDocuments(
        docsWithMetadata,
        embeddings,
        {
          pineconeIndex: index,
          namespace: PINECONE_NAME_SPACE,
          textKey: 'text',
        },
      );

      console.log('ingestion completed');
      if (result) {
        // Delete all files from the "docs" folder
        const folderPath = path.join(process.cwd(), 'docs');
        fs.readdir(folderPath, (err, files) => {
          if (err) {
            console.log('Error reading directory', err);
            return;
          }

          files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            fs.unlink(filePath, (err) => {
              if (err) {
                console.log('Error deleting file', err);
                return;
              }
              console.log(`Deleted file: ${filePath}`);
            });
          });
        });
      }

      res.status(200).json({ message: 'Ingestion complete' });
    });
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: 'Failed to ingest your data' });
  }
}
