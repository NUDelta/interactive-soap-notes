//index.tsx
import { OutputData } from "@editorjs/editorjs";
import type { NextPage } from "next";
import dynamic from "next/dynamic";
import { useState } from "react";

import TextInput from "react-autocomplete-input";
import "react-autocomplete-input/dist/bundle.css";

// important that we use dynamic loading here
// editorjs should only be rendered on the client side.
// const EditorBlock = dynamic(() => import("../components/Editor"), {
//   ssr: false,
// });

const Home: NextPage = () => {
  //state to hold output data. we'll use this for rendering later
  const [data, setData] = useState<OutputData>();
  return (
    // add a header div with the name of the SOAP note
    // make page centered and 50% width
    <div className="container m-auto grid grid-cols-2 gap-x-5 gap-y-5 auto-rows-auto w-3/4">
      <div className="col-span-2 ">
        <h1 className="font-bold text-4xl">SOAP Notes -- SIG Name, Date</h1>
      </div>

      {/* Subjective section */}
      <div className="w-full">
        <h1 className="font-bold text-xl">
          S - Subjective observations from student report
        </h1>

        {/* resizing textbox: https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/ */}
        <div className="">
          <TextInput
            trigger={["@", "@@", "[script]"]}
            options={{
              "@": ["aa", "ab", "abc", "abcd"],
              "@@": ["az", "ar"],
              "[script]": ["script1", "script2"],
            }}
          />
        </div>
      </div>

      {/* Objective section */}
      <div className="w-full">
        <h1 className="font-bold text-xl">
          O - Objective data corresponding with students assessment
        </h1>

        <div className="">
          <TextInput
            trigger={["@", "@@", "[script]"]}
            options={{
              "@": ["aa", "ab", "abc", "abcd"],
              "@@": ["az", "ar"],
              "[script]": ["script1", "script2"],
            }}
          />
        </div>
      </div>

      {/* Assessment section */}
      <div className="w-full col-span-2">
        <h1 className="font-bold text-xl">
          A - Assessment of root causes or practices
        </h1>
        <div className="">
          <TextInput
            trigger={["@", "@@", "[script]"]}
            options={{
              "@": ["aa", "ab", "abc", "abcd"],
              "@@": ["az", "ar"],
              "[script]": ["script1", "script2"],
            }}
          />
        </div>
      </div>

      {/* Plan section */}
      <div className="w-full col-span-2">
        <h1 className="font-bold text-xl">P - Plan for Follow-Ups</h1>
        <div className="">
          <TextInput
            trigger={["@", "@@", "[script]"]}
            options={{
              "@": ["aa", "ab", "abc", "abcd"],
              "@@": ["az", "ar"],
              "[script]": ["script1", "script2"],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
