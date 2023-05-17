import Layout from '../components/layout';
import { getCookie } from 'cookies-next';
import Link from 'next/link';

export default function HomePage({ username }) {
  return (
    <Layout pageTitle="Home">
      {username ? (
        <>
          <h2>Hi {username}</h2>
          <Link href="/profile">Profile</Link>
          <br />
          <Link href="/chat">Chat with Docs</Link>
          <br />
          <Link href="/file-upload">Upload PDF</Link>
          <br />
          <Link href="/api/logout">Logout</Link>
        </>
      ) : (
        <>
          <h2>Welcome </h2>
          <Link href="/login">Login</Link>
          <br />
          <Link href="/signup">Signup</Link>
        </>
      )}
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const req = context.req;
  const res = context.res;
  const token = getCookie('token', { req, res });

  let username = true;
  if (token == undefined) {
    username = false;
  }

  return { props: { username } };
}
