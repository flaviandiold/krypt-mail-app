import React from "react";
import TitleBar from "~/components/TopBar/WindowBar";
import { tags } from "../../static/constants/tags";

function Loading({ icon }) {
  return (
    <div className="bg-LoadingBackground  text-LoadingText">
      <>
        <TitleBar icon={icon} />
        <div className="flex flex-col justify-center items-center      h-[calc(100vh_-_2rem)]">
          <div className="flex flex-col items-center ">
            <h1 className="text-3xl font-bold capitalize  leading-loose mr-4  ">
              {tags.loadingtag}
            </h1>
          </div>
        </div>
      </>
    </div>
  );
}

export default Loading;
