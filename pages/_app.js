import Head from "next/head";
import Link from "next/link";

import "../styles/globals.css"; // important
// EDIT THIS LATER: should probably be landing page for SOAP notes
// or have button that takes you to index

// note: what should Home do? Maybe something like "view notes" instead

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Interactive SOAP Notes</title>
        <link rel="stylesheet" href="bootstrap/css/bootstrap.min.css"></link>
      </Head>

      <div className="top-bar">
        <div className="nav">
          <Link href="/">
            <a className="link-primary">Home</a>
          </Link>
          <Link href="/new">
            <a className="link-primary">Write SOAP Note</a>
          </Link>
        </div>

      </div>
      <div className="grid wrapper">
        <Component {...pageProps} />
        {/* what does this ^^ do */}
      </div>
    </>
  );
}

export default MyApp;
