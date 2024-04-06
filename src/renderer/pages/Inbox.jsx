import React, { useEffect, useState } from "react";
import Structure from "../utils/Structure";
import { FetchMail, OnUpdatedMailFromServer } from "../services";
import { useDispatch, connect } from "react-redux";
import { setAllMail } from "../redux/actions/MailList";
import { checkExists, readFile, WriteFile } from "~/lib/fileAction";
import { getInformation } from "~/services/flow";
import { setEnvelope } from "~/redux/actions/MailList";
import { SettingTypes } from "../static/constants/Settings";
import { setLoading } from "../redux/actions/LoadingActions";
import { setFolderStrucure, setMailStats } from "../redux/actions/appActions";
import { ParseContent } from "../utils/Utils";
import { setUser, setUsersList } from "../redux/actions/UserActions";
import Loading from "../components/Loading/Loading";
import { getTotalMailInServer } from "../services";

import {
  CheckForMailExistense,
  fetchMail,
  GetFetchedCount,
  GetFolderStructureFromServer,
  GetUser,
  GetUserHome,
  inboxpath,
  Parser,
} from "../utils/provider/folderProvider";
import { createFolder } from "../lib/fileAction";
const { ImapFlow } = window.require("imapflow");
const path = require("path");
// localStorage.clear();
function Home({
  user,
  currentSideBar,
  loading,
  MailStats,
  Envelope,
  maillist,
  folderStructure,
  userslist,
}) {
  let userHome = user ? user?.auth?.user : GetUserHome();
  let MailPath = currentSideBar?.path ? currentSideBar?.path : "INBOX";
  const [StoreObj, setStoreObj] = useState();
  const [isAnyMailOpen, setisAnyMailOpen] = useState(false);
  const [openedMail, setopenedMail] = useState("");
  const [composeopen, setcomposeopen] = useState(false);
  const [ActionFromreply, setActionFromreply] = useState("newcompose");
  const [SearchText, setSearchText] = useState("");
  const [FilteredData, setFilteredData] = useState([]);
  const [InfoData] = useState(Parser(inboxpath(userHome, "conf")));
  const [ActiveUser, setActiveUser] = useState(user ? user : GetUser());
  let totalMailInServer = parseInt(
    localStorage.getItem(`totalMailInServer:${user?.auth?.user}`)
  );
  console.log(Envelope, maillist, "mail details");
  if (!totalMailInServer) {
    setTotalMailInServer();
  }
  const intervalCbs = [];
  let userDefinedFetchLimit = JSON.parse(localStorage.getItem("fetchlimit"))
    ? JSON.parse(localStorage.getItem("fetchlimit"))
    : null;
  const [tLen, settLen] = useState(InfoData?.mailStatus?.messages);
  const [fLimit, setfLimit] = useState(
    tLen
      ? tLen > userDefinedFetchLimit
        ? userDefinedFetchLimit
        : tLen > 50
        ? 50
        : tLen
      : 10
  );
  const [fetchedCount, setfetchedCount] = useState(
    GetFetchedCount(path.join(userHome, "mail", "mail"))
  );
  const dispatch = useDispatch();
  const [store] = useState(SettingTypes["boolvaled"][1].defaultval);
  console.log(user, "beforeSettingUser");
  let client = new ImapFlow(user),
    updatedClient,
    infoclient;

  useEffect(() => {
    let isMounted = true;
    console.log("happens when user changes");
    clearDetails();
    if (ActiveUser != user) {
      console.log("active user is not user");
      dispatch(setLoading(true));
      setisAnyMailOpen(false);
      GetFolderStructure();
    }
    return () => {
      return (isMounted = false);
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    dispatch(setLoading(true));
    GetFolderStructure();
    return () => {
      isMounted = false;
    };
  }, []);

  // useEffect(() => {
  //   setTimeout(() => {
  //     const timerId = setInterval(async () => {
  //       console.log("fetching new Mail", totalMailInServer);
  //       console.log(user, "data at useEffect");
  //       console.log(client);
  //       if (!totalMailInServer) {
  //         totalMailInServer = await getTotalMailInServer(
  //           new ImapFlow(user),
  //           "INBOX"
  //         );
  //       }
  //       console.log("fetching new Mail", totalMailInServer);
  //       UpdateArrayWithLatestMail(user);
  //     }, 1000);
  //     intervalCbs.push(timerId);
  //   }, 1000);
  // });

  useEffect(() => {
    console.log("changes user");
  }, [userslist]);

  function clearDetails() {
    console.log(intervalCbs);
    for (const timerId of intervalCbs) clearInterval(timerId);
    totalMailInServer = null;
  }
  async function GetOneUser() {
    let userslist = JSON.parse(readFile("userslist"));
    if (userslist?.length > 0) {
      dispatch(setUsersList(userslist));
      let firstuser = userslist[0]?.auth?.user;
      return JSON.parse(readFile(inboxpath(firstuser, "user")))
        ? JSON.parse(readFile(inboxpath(firstuser, "user")))
        : null;
    }
  }

  async function setTotalMailInServer() {
    totalMailInServer = await getTotalMailInServer(new ImapFlow(user), "INBOX");
    localStorage.setItem(
      `totalMailInServer:${user?.auth?.user}`,
      totalMailInServer
    );
  }

  async function GetFolderStructure() {
    try {
      if (!user) {
        console.log("there is no user");
        let data = await GetOneUser();
        if (data) {
          setActiveUser(data);
          dispatch(setUser(data));
          userHome = data?.auth?.user;
          GetStructure(userHome, data);
        }
      } else {
        console.log("there is a user");
        GetStructure(user?.auth?.user, user);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function GetStructure(userHome, data) {
    let folder = await ParseContent(inboxpath(userHome, "conf"));
    console.log(folder, "in get structure");
    if (folder) {
      DispatchFolderStructure(folder, data);
    } else {
      client = new ImapFlow(data);
      let val = await GetFolderStructureFromServer(
        client,
        inboxpath(userHome, "conf"),
        MailPath
      );
      console.log(folder, "in get structure created folder");
      DispatchFolderStructure(val, data);
    }
  }

  async function DispatchFolderStructure(folder, data) {
    console.log(data, "in dispatch folder structure");

    if (folder) {
      settLen(folder?.mailStatus?.messages);
      let fetchlimit = userDefinedFetchLimit
        ? folder?.mailStatus?.messages > userDefinedFetchLimit
          ? userDefinedFetchLimit
          : folder?.mailStatus?.messages
        : folder?.mailStatus?.messages > 50
        ? 50
        : folder?.mailStatus?.messages;
      if (fetchlimit === 0) fetchlimit = 50;
      console.log("fetchlimit", fetchlimit);
      setfLimit(fetchlimit);
      dispatch(setMailStats(folder));
      dispatch(setFolderStrucure(folder?.folderTree));
      let mailfromlocal = await CheckForMailExistense(
        inboxpath(data?.auth?.user, "mail")
      );
      if (mailfromlocal) {
        console.log("there is mail from local ie.,", mailfromlocal);
        await DispatchMails(mailfromlocal.Mail, mailfromlocal?.Body);
        // setTimeout(async () => {
        //   await UpdateArrayWithLatestMail(data);
        // }, 10000);
        // setStoreObj(obj);
      } else {
        client = new ImapFlow(data);
        let obj = await fetchMail(
          false,
          false,
          data,
          "INBOX",
          fetchlimit,
          fetchedCount,
          totalMailInServer,
          client
        );
        folder.mailStatus = obj.status;
        WriteFile(path.join(folder.user, "conf", "conf.txt"), folder);
        DispatchMails(obj.Mail, obj.parsedjson);
        // setTimeout(async () => {
        //   await UpdateArrayWithLatestMail(data);
        // }, 10000);
        settLen(obj.Mail.length);
        delete obj.parsedjson;
        setStoreObj(obj);
      }
    }
  }

  async function DispatchMails(envelopearray, Messagesarray) {
    console.log(Envelope, maillist, "before dispatch");
    console.log(envelopearray, Messagesarray, "at dispatch", user?.auth?.user);
    await dispatch(setEnvelope(envelopearray));
    await dispatch(setAllMail(Messagesarray));
    console.log(Envelope, maillist, "after dispatch", user?.auth?.user);
    setfetchedCount(envelopearray?.length ? envelopearray.length : 0);
    dispatch(setLoading(false));
  }

  useEffect(() => {
    if (StoreObj) {
      if (
        store &&
        Object.values(StoreObj)[0]?.length > 0 &&
        Object.values(StoreObj)[1]?.length > 0 &&
        Object.values(StoreObj)[0]?.length ===
          Object.values(StoreObj)[1]?.length
      ) {
        console.log("stores");
        StoreAsFile();
      } else {
        console.log(
          "cannot store",
          store,
          Object.values(StoreObj)[0]?.length > 0,
          Object.values(StoreObj)[1]?.length > 0,
          Object.values(StoreObj)[0]?.length ===
            Object.values(StoreObj)[1]?.length
        );
      }
    }
    return () => {};
  }, [StoreObj]);

  function StoreAsFile() {
    if (!checkExists(path.join(userHome, "mail"))) {
      createFolder(path.join(userHome, "mail"));
      WriteFile(inboxpath(userHome, "mail"), StoreObj);
    } else {
      WriteFile(inboxpath(userHome, "mail"), StoreObj);
    }
  }
  async function FetchUptoNextLimit() {
    dispatch(setLoading(true));
    let rlen = tLen - fetchedCount;
    // client = new ImapFlow(user);
    let { Messagesarray, envelopearray } = await FetchMail(
      client,
      rlen < fLimit ? rlen : fLimit,
      fetchedCount,
      true,
      true,
      "INBOX"
    );
    if (envelopearray.length > 0 && Messagesarray.length > 0) {
      let envelopeconcat = envelopearray.concat(Envelope);
      let maillistconcat = Messagesarray?.concat(maillist);
      CallToaddLatestMail(envelopeconcat, maillistconcat);
      dispatch(setLoading(false));
    }
  }

  async function UpdateArrayWithLatestMail(data) {
    console.log("gets here update array with mail");
    updatedClient = new ImapFlow(data);
    if (!totalMailInServer) {
      // console.log(
      //   await getTotalMailInServer(new ImapFlow(user), "INBOX"),
      //   "logging totalMailInServer"
      // );
      totalMailInServer = parseInt(
        localStorage.getItem(`totalMailInServer:${user?.auth?.user}`)
      );

      console.log(totalMailInServer, "totalMailAtServer", user?.auth?.user);
    }
    console.log(Envelope, maillist, "before call", user?.auth?.user);
    let { count, latestmailwithenvelope, latestMessagesarray } =
      await OnUpdatedMailFromServer(
        updatedClient,
        fetchedCount,
        totalMailInServer,
        "INBOX"
      );
    if (count) {
      console.log("entered");
      // let mailfromlocal = await ParseContent(
      //   path.join(data?.auth?.user, "mail", "mail")
      //   );
      //   console.log(mailfromlocal,data);
      //   console.log(Envelope,maillist);

      // if (mailfromlocal?.Mail?.length > 0 && mailfromlocal?.Body?.length > 0) {
      settLen(tLen + count);
      totalMailInServer += count;
      localStorage.setItem(
        `totalMailInServer:${user?.auth?.user}`,
        totalMailInServer
      );
      console.log(latestmailwithenvelope, latestMessagesarray);
      console.log(Envelope, maillist);
      let envelopeconcat = Envelope.concat(latestmailwithenvelope);
      let maillistconcat = maillist.concat(latestMessagesarray);
      console.log("updates");
      CallToaddLatestMail(envelopeconcat, maillistconcat);
      infoclient = new ImapFlow(data);
      getInformation(
        infoclient,
        "INBOX",
        path.join(userHome, "conf", "conf.txt")
      );
    }
  }

  function CallToaddLatestMail(envelopeconcat, maillistconcat) {
    let obj = {};
    obj.Mail = envelopeconcat;
    obj.Body = maillistconcat;
    dispatch(setEnvelope(envelopeconcat));
    setfetchedCount(envelopeconcat?.length);
    dispatch(setAllMail(maillistconcat));
    setStoreObj(obj);
  }

  function SearchFor() {
    let FilteredData = Envelope?.filter(function (item) {
      return item?.subject?.toLowerCase().includes(SearchText?.toLowerCase());
    });
    if (FilteredData?.length > 0) {
      setFilteredData(FilteredData);
    } else {
      setFilteredData([]);
    }
  }

  if (loading) {
    return <Loading />;
  }
  return (
    <div>
      <Structure
        isAnyMailOpen={isAnyMailOpen}
        setisAnyMailOpen={setisAnyMailOpen}
        Data={Envelope?.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        })}
        openedmail={openedMail}
        setopenedmail={setopenedMail}
        composeopen={composeopen}
        setcomposeopen={setcomposeopen}
        message={maillist}
        Quota={MailStats?.quota}
        actionFromReply={ActionFromreply}
        setactionFromReply={setActionFromreply}
        searchText={SearchText}
        setsearchText={setSearchText}
        search={SearchFor}
        FilteredData={FilteredData}
        Status={tLen}
        FetchUptoNextLimit={FetchUptoNextLimit}
        Refresh={() => UpdateArrayWithLatestMail(user)}
        MailStats={MailStats}
        folderStructure={folderStructure}
        userHome={userHome}
        userslist={userslist}
        user={user}
      />
    </div>
  );
}

const mapStateToProps = (state) => {
  // console.log(state, "props");

  return {
    loading: state.loadingDetails.loading,
    maillist: state.mailDetails.maillist,
    Envelope: state.mailDetails.Envelope,
    currentSideBar: state.appDetails.currentSideBar,
    folderStructure: state.appDetails.folderStructure,
    MailStats: state.appDetails.MailStats,
    user: state.userDetails.user,
    userslist: state.userDetails.userslist,
  };
};

const mapDispatchToProps = {};
export default connect(mapStateToProps, mapDispatchToProps)(Home);
