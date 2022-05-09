import Head from "next/head";
import Link from "next/link";

import "../styles/globals.css"; // important
// EDIT THIS LATER: should probably be landing page for SOAP notes
// or have button that takes you to index

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Interactive SOAP Notes</title>
      </Head>

      <div className="top-bar">
        <div className="nav">
          <Link href="/">
            <a>Home</a>
          </Link>
          <Link href="/new">
            <a>Add Note</a>
          </Link>
        </div>

        <img
          id="title"
          src="https://upload.wikimedia.org/wikipedia/commons/1/1f/Pet_logo_with_flowers.png"
          alt="pet care logo"
        ></img>
      </div>
      <div className="grid wrapper">
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp;
