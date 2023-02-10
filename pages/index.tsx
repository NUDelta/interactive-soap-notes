//index.tsx
import { OutputData } from "@editorjs/editorjs";
import type { NextPage } from "next";
import dynamic from "next/dynamic";
import { useState } from "react";

// important that we use dynamic loading here
// editorjs should only be rendered on the client side.
const EditorBlock = dynamic(() => import("../components/Editor"), {
  ssr: false,
});

const Home: NextPage = () => {
  //state to hold output data. we'll use this for rendering later
  const [data, setData] = useState<OutputData>();
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="col-span-1">
        <h1>S - Subjective</h1>
        <div className="border rounded-md">
          <EditorBlock
            data={data}
            onChange={setData}
            holder="editorjs-container"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
