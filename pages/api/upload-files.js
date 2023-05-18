import jwt from 'jsonwebtoken';
import { getCookie } from 'cookies-next';
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    // Retrieve the token from the request cookies
    const token = getCookie('token', { req });
    if (!token) {
      res.status(500).json({ error: 'Unable to fetch user data' });
      return;
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    // Retrieve user data from the decoded token (assuming it contains the user object)
    const userId = decodedToken.id;

    // Create a MongoDB ObjectId using the user ID
    const objectId = new ObjectId(userId);
    const client = await clientPromise;
    const db = client.db('Users');
    const user = await db.collection('Profiles').findOne({ _id: objectId });

    // Get the files from the request body
    const { files } = req.body;

    // Process each file
    const uniqueFiles = [];
    for (const file of files) {
      // Generate a unique ID for the file
      const fileId = new ObjectId();

      // Create a unique file name by appending the file ID to the original file name
      const uniqueFileName = `${file}_${fileId}`;

      // Store the unique file name with the user ID
      const newFile = {
        name: uniqueFileName,
      };
      // Add the new file to the uniqueFiles array
      uniqueFiles.push(newFile);
    }

    // Update the user's files with the uniqueFiles array
    user.files = uniqueFiles;

    // Save the updated user data to the database
    await db
      .collection('Profiles')
      .updateOne({ _id: objectId }, { $set: user });

    // Return the updated user data as the API response
    res.status(200).json(user);
  } catch (error) {
    // Handle token verification or other errors
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Unable to fetch user data' });
  }
}