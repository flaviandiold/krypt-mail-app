import React from "react";
import { tags } from "../../static/constants/tags";

function Stats({ uname, Data, UnreadCount, StarredCount }) {

  return (
    <div>
      <section className="text-StatCardText ">
        <div className="max-w-screen-xl px-0 py-16 mx-auto  ">
          <div className="max-w-xl ">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              {tags.stattitle}, {(uname?.split("@")[0])}
            </h2>
            <p className="mt-4 sm:text-xl">{tags.stattagline}</p>
          </div>
          <ul className="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 lg:grid-cols-3">
            <li className="p-8 shadow-xl rounded-xl bg-StatCardBackground">
              <p className="text-3xl font-extrabold">{Data?.length}</p>
              <p className="mt-1 text-xl font-medium">
                {" "}
                {tags.stat1}
              </p>
            </li>

            <li className="p-8 shadow-xl rounded-xl bg-StatCardBackground">
              <p className="text-3xl font-extrabold">{UnreadCount}</p>
              <p className="mt-1 text-xl font-medium">
                {" "}
                {tags.stat2}
              </p>
            </li>

            <li className="p-8 shadow-xl rounded-xl bg-StatCardBackground">
              <p className="text-3xl font-extrabold">{StarredCount}</p>
              <p className="mt-1 text-xl font-medium">
                {" "}
                {tags.stat3}
              </p>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default Stats;
