import Head from 'next/head';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import NextNProgress from 'nextjs-progressbar';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧼</text></svg>"
        />
      </Head>

      {/* TODO: works fine with pages/ routing, but not app/. See: https://stackoverflow.com/questions/55624695/loading-screen-on-next-js-page-transition#comment135424552_70086644*/}
      <NextNProgress color="#FBAF3C" height={6} />

      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
