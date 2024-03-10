import React from "react";
import {
  MdGridView,
  MdRefresh,
  MdTableView,
  MdViewCompact,
  MdViewList,
} from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import PaginationComp from "./PaginationComp";
import {tags} from "../../static/constants/tags"

function ListTopIcons({
  Refresh,
  TotalCount,
  FetchLimit,
  FetchUptoNextLimit,
  Data,
  GridView,
  setGridView,
  message,
}) {

  const location = useLocation();

  return (
    <div className="flex flex-col text-text ">
      <div className="  flex  mt-4 items-center justify-evenly">
        <div className="flex flex-row">
          <MdRefresh
            size={30}
            className="ml-1 mr-2 cursor-pointer "
            onClick={Refresh}
            title={tags.Refresh}
          />
          {GridView == 2 && (
            <MdViewList
              className="mr-2 cursor-pointer "
              size={30}
              onClick={() => setGridView(0)}
              title={("ListView")}
            />
          )}
          {GridView == 0 && (
            <MdGridView
              className="mr-2 cursor-pointer "
              size={30}
              onClick={() => setGridView(1)}
              title={("GridView")}
            />
          )}
          {GridView == 1 && (
            <MdViewCompact
              className="mr-2 cursor-pointer "
              title={("DefaultView")}
              size={30}
              onClick={() => setGridView(2)}
            />
          )}
          {
            // <Link
            //   to={{
            //     pathname: "/tableView",
            //   }}
            //   state={{
            //     path: location?.pathname,
            //   }}
            // >
            //   <MdTableView
            //     title={("TableView")}
            //     className="mr-2 cursor-pointer "
            //     size={30}
            //   />
            // </Link>
          }
        </div>
        <span className="font-mono font-semibold  mr-2">
          {Data?.length} {tags.FetchedMessages}
        </span>
        <div className="hidden lg:flex">
          <PaginationComp
            TotalCount={TotalCount}
            FetchLimit={FetchLimit}
            FetchUptoNextLimit={FetchUptoNextLimit}
          />
        </div>
      </div>
    </div>
  );
}

export default ListTopIcons;
