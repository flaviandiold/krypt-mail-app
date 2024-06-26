import React, { useState } from "react";
import ListMail from "../components/ListMail/ListMail";
import ShowMail from "../components/ShowMail/ShowMail";
import SideBar from "../components/SideBar/SideBarWrapper";
import TopBar from "../components/TopBar/TopBar";
import SelfPromotional from "../components/Promotional/Promote";
import TitleBar from "~/components/TopBar/WindowBar";
import { EditorState } from "draft-js";
import useComponentVisible from "./TouchBehaviour";
import { MdMenu } from "react-icons/md";
import { SettingTypes } from "~/static/constants/Settings";
import ComposeBox from "~/components/ShowMail/ComposeBox";
import FilterCard from "~/components/TopBar/FilterCard";
import { readFile } from "../lib/fileAction";
import filter from "./provider/filterProvider";
import { filterByText } from "./provider/filterProvider";
import MultiUserAdd from "../components/Login/MultiUserAdd";
const path = require("path");
function Structure({
  isAnyMailOpen,
  setisAnyMailOpen,
  Tabs,
  Data,
  theme,
  openedmail,
  setopenedmail,
  composeopen,
  setcomposeopen,
  unseenCount,
  listOfUid,
  message,
  Quota,
  actionFromReply,
  setactionFromReply,
  searchText,
  setsearchText,
  search,
  FilteredData,
  Status,
  FetchLimit,
  FetchUptoNextLimit,
  Refresh,
  MailStats,
  folderStructure,
  userHome,
  userslist,
  user,
}) {
  const [toggle, settoggle] = useState(null);
  const [selected, setselected] = useState(localStorage.getItem("curFilter"));
  const { ref } = useComponentVisible(false, toggle, settoggle);
  const [GridView, setGridView] = useState(2);
  const [ModalOpen, setModalOpen] = useState(false);
  const [isDrawerOpen, setisDrawerOpen] = useState(
    SettingTypes["boolvaled"][0]?.defaultval
  );
  const [HideTopbar] = useState(SettingTypes["boolvaled"][3]?.defaultval);
  const [editorState, setEditorState] = React.useState(() =>
    EditorState.createEmpty()
  );

  function OnFilterSelection(selected) {
    setselected(selected);
    localStorage.setItem("curFilter", selected);
    filter(selected, Data);
  }

  if (searchText) {
    // console.log(searchText, search);
    FilteredData = filterByText(searchText, Data);
    console.log(FilteredData, "after filter");
  }
  // console.log(FilteredData, Data);
  return (
    <div>
      <TitleBar
        Icon={MdMenu}
        isDrawerOpen={isDrawerOpen}
        setisDrawerOpen={setisDrawerOpen}
      />
      {ModalOpen && <MultiUserAdd setModalOpen={setModalOpen} />}
      <div className=" flex h-[calc(100vh_-_2rem)] ">
        <div ref={ref} className=" overflow-hidden">
          {toggle && (
            <FilterCard
              toggle={toggle}
              settoggle={settoggle}
              selected={selected}
              setselected={setselected}
              onFilterSelection={(val) => OnFilterSelection(val)}
            />
          )}
          <div>
            {isDrawerOpen && (
              <SideBar
                isDrawerOpen={isDrawerOpen}
                setisDrawerOpen={setisDrawerOpen}
                setcomposeopen={setcomposeopen}
                composeopen={composeopen}
                actionFromReply={actionFromReply}
                setactionFromReply={setactionFromReply}
                isAnyMailOpen={isAnyMailOpen}
                folderStructure={folderStructure}
                userHome={userHome}
                user={user}
              />
            )}
          </div>
        </div>
        <div className="flex-1 flex-col flex overflow-hidden ">
          {!HideTopbar && (
            <TopBar
              isDrawerOpen={isDrawerOpen}
              setisDrawerOpen={setisDrawerOpen}
              theme={theme}
              Quota={Quota && Quota}
              searchText={searchText}
              setsearchText={setsearchText}
              search={search}
              selection={selected}
              setselection={setselected}
              toggled={toggle}
              settoggled={settoggle}
              uname={MailStats?.user}
              userslist={userslist}
              userHome={userHome}
              setModalOpen={setModalOpen}
            />
          )}
          <div className="flex flex-1 flex-row overflow-hidden  ">
            {Data?.length > 0 && (
              <div
                boundsByDirection
                onResizeStop={(e, direction, ref, d) => {
                  console.log(d.width, d.height, direction);
                }}
                className={`overflow-y-scroll ${
                  GridView == 2 ? "max-w-sm" : "w-full "
                } scroll-smooth   scrollbar-thin  scrollbar-thumb-primary scrollbar-track-windowBarBackground  scrollbar-thumb-rounded-full scrollbar-track-rounded-full justify-center items-center  `}
              >
                <ListMail
                  Data={searchText.length > 0 ? FilteredData : Data}
                  GridView={GridView}
                  setGridView={setGridView}
                  Tabs={Tabs}
                  isAnyMailOpen={isAnyMailOpen}
                  setisAnyMailOpen={setisAnyMailOpen}
                  openedmail={openedmail}
                  setopenedmail={setopenedmail}
                  unseenCount={unseenCount}
                  message={message}
                  TotalCount={Status}
                  FetchLimit={FetchLimit}
                  FetchUptoNextLimit={FetchUptoNextLimit}
                  setcomposeopen={setcomposeopen}
                  Refresh={Refresh}
                  user={user}
                />
              </div>
            )}
            {isAnyMailOpen ? (
              <div className=" overflow-y-scroll no-scrollbar w-full ">
                <ShowMail
                  openedmail={openedmail}
                  setopenedmail={setopenedmail}
                  composeopen={composeopen}
                  setcomposeopen={setcomposeopen}
                  listOfUid={listOfUid}
                  message={message}
                  actionFromReply={actionFromReply}
                  setactionFromReply={setactionFromReply}
                  setisAnyMailOpen={setisAnyMailOpen}
                  maillist={Data}
                  pathContents={JSON.parse(
                    readFile(path.join(userHome, "conf", "conf.txt"))
                  )}
                  userHome={userHome}
                  user={user}
                />
              </div>
            ) : (
              <>
                {!composeopen && GridView == 2 && (
                  <div className=" overflow-y-scroll scrollbar-thin scrollbar-thumb-primary scrollbar-track-secondary w-full md:flex hidden  ">
                    <SelfPromotional
                      uname={MailStats?.user ? MailStats?.user : ""}
                      Data={message}
                      composeopen={composeopen}
                      setcomposeopen={setcomposeopen}
                    />
                  </div>
                )}
                {composeopen && (
                  <div className=" w-full   mx-10">
                    <ComposeBox
                      editorState={editorState}
                      setEditorState={setEditorState}
                      composeopen={composeopen}
                      setcomposeopen={setcomposeopen}
                      toadress=""
                      subject=""
                      action={actionFromReply}
                      userHome={userHome}
                      message=""
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Structure;
