# Interactive SOAP Notes

A tool that supports coaching in networked learning communities by: (1) providing more awareness of
students' needs during coaching sessions; and (2) scaffolding coaching interactions that are
discussed during a coaching meeting in venues throughout the week.

## Setup

1. Make sure you have [Node.js](https://nodejs.org/en/), [yarn](https://classic.yarnpkg.com/en/docs/install#mac-stable), and [MongoDB](https://www.mongodb.com/docs/guides/server/install/) installed.
2. Clone the [Studio API](https://github.com/NUDelta/studio-api) and [Orchestration Engine](https://github.com/NUDelta/orchestration-engine).
3. Clone the repository, and create a `.env` file with the following:

   ```env
   MONGODB_URI=mongodb://127.0.0.1/interactive-soap-notes
   STUDIO_API=http://localhost:3000
   ORCH_ENGINE=http://localhost:5001
   ```

4. Run `yarn install` to install packages.

## Running Code Locally

Look at [this link](https://www.mongodb.com/docs/v4.4/mongo/#start-the-mongo-shell-and-connect-to-mongodb) to find the commands to run the Mongo shell and a local server.

### Local Development

1. [Start MongoDB](https://www.mongodb.com/docs/manual/tutorial/manage-mongodb-processes/) in a separate shell.
2. Start an instance of the Studio API and Orchestration Engine based on their respective READMEs.
3. Run `yarn dev` and navigate to `localhost:3001` in your browser. Changes in code will automatically cause the website to be re-built and update the browser.
