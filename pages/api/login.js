import Cookies from 'cookies';
import { sign } from 'jsonwebtoken';
import clientPromise from '../../lib/mongodb';
const { createHash } = require('node:crypto');

export default async function handler(req, res) {
  if (req.method == 'POST') {
    const username = req.body['username'];
    const guess = req.body['password'];
    const client = await clientPromise;
    const db = client.db('Users');
    const users = await db
      .collection('Profiles')
      .find({ Username: username })
      .toArray();
    if (users.length == 0) {
      res.redirect('/login?msg=Incorrect username or password');
      return;
    }
    const user = users[0];

    const guess_hash = createHash('sha256').update(guess).digest('hex');
    if (guess_hash == user.Password) {
      const cookies = new Cookies(req, res);
      const token = sign({ id: user?._id }, process.env.SECRET_KEY, {
        expiresIn: '1h',
      });

      cookies.set('token', token, {
        maxAge: 3600000, // 1 hour in milliseconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      res.redirect('/');
    } else {
      res.redirect('/login?msg=Incorrect username or password');
    }
  } else {
    res.redirect('/');
  }
}
