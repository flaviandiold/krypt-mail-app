import React, { useState, useEffect } from "react";
import {
  MdAlternateEmail,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { FiServer } from "react-icons/fi";
import InputField from "~/components/Login/InputField";
import { setAuthenticated } from "~/redux/actions/UserActions";
import { useDispatch, connect } from "react-redux";
import { ManualSetup } from "~/components/Login/ManualSetup";
import Button from "~/components/Basic/Button";
import { LogintoAccount } from "~/services";
import { setLoading } from "~/redux/actions/LoadingActions";
import { checkExists, createFolder, WriteFile } from "~/lib/fileAction";
import WindowBar from "../components/TopBar/WindowBar";
import { readFile } from "../lib/fileAction";
import { applyTheme } from "../themes/themeutil";
import { setUser } from "../redux/actions/UserActions";
import { Link } from "react-router-dom";

const { ImapFlow } = require("imapflow");
const path = require("path");
const pino = require("pino")();
pino.level = "silent";


function Register({ frommultiuser }) {
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [name, setname] = useState("");
  const [Port] = useState(993);
  const [visible, setvisible] = useState(true);
  const [isSecure] = useState(true);
  const [Host, setHost] = useState("");
  const [Errors, setErrors] = useState("");
  const [port, setport] = useState("993");
  const [smtpHost, setsmtpHost] = useState("");
  const [smtpPort, setsmtpPort] = useState(465);
  const [securesmtp] = useState(true);
  let client;
  const dispatch = useDispatch();
  const [selected] = useState({
    host: ManualSetup[1].options[0].host,
    secure: isSecure,
    port: Port,
    logger: pino,
    auth: {
      user: email,
      pass: password,
      accessToken: null,
    },
  });

  let smtpobj = {
    host: "",
    secure: securesmtp,
    port: smtpPort,
    auth: {
      user: email,
      pass: password
    }
  }

  useEffect(() => {
    dispatch(setLoading(false));
    if (!frommultiuser) {
      applyTheme("Light");
    }
    return () => { };
  }, []);

  async function onSuccess(res) {
    let accountexists = false;
    selected.auth.user = res?.profileObj?.email;
    selected.auth.accessToken = res?.accessToken;
    delete selected.auth.pass;
    client = new ImapFlow(selected);
    let result = await LogintoAccount(client);
    if (result && typeof (result == 'boolean') && result == true) {
      let userslist = JSON.parse(readFile("userslist"));
      let obj = userslist && userslist?.length > 0 && userslist?.find((o, i) => {
        if (o?.auth?.user === res?.profileObj?.email) {
          alert("account already exists");
          accountexists = true;
          dispatch(setLoading(false));
          return true;
        }
      });
      if (!accountexists) {
        onResultTrue(res?.profileObj?.email);
      }
    } else {
      console.log(result);
    }
  }

  function onFailure(err) {
    console.log(err);
    setErrors(err);
  }

  function onResultTrue(email, selected) {
    if (checkExists("")) {
      if (checkExists(email)) {
        StoreInfo(email, selected);
      } else {
        createFolder(email);
        createFolder(path.join(email, "conf"));
        StoreInfo(email, selected);
      }
    } else {
      createFolder("");
      createFolder(email);
      createFolder(path.join(email, "conf"));
      StoreInfo(email, selected);
    }
  }

  const onRegisterClick = async () => {
      console.log('register');
  };

  function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  function StoreInfo(email, selected) {
    let accountexists = false;
    let userslist = JSON.parse(readFile("userslist"));
    if (userslist?.length > 0) {
      let obj = userslist.find((o, i) => {
        if (o?.auth?.user === selected?.auth?.user) {
          alert("account already exists");
          accountexists = true;
          dispatch(setLoading(false));
          return true;
        }
      });
      if (!accountexists) {
        userslist?.push(selected);
        WriteFile(path.join("userslist"), userslist);
      }
    } else {
      let usersarray = [];
      usersarray[0] = selected;
      WriteFile(path.join("userslist"), usersarray);
    }
    if (frommultiuser) {
      dispatch(setUser(selected));
    }
    if (!accountexists) {
      smtpobj = selected
      WriteFile(path.join(email, "user.txt"), selected);
      smtpobj.port = smtpPort
      smtpobj.host = smtpHost
      delete smtpobj["logger"];
      delete smtpobj["auth"]["accessToken"];
      smtpobj.secure = securesmtp;
      WriteFile(path.join(email, "smtp.txt"), smtpobj);
      dispatch(setAuthenticated(true));
      dispatch(setLoading(false));
    }
  }

  return (
    <div>
      {!frommultiuser && <WindowBar icon={false} />}
      <section
        className={
        //   !frommultiuser
            "relative flex flex-wrap lg:h-[calc(100vh_-_2rem)]  lg:items-center justify-center text-text  bg-cover "
            // ""
        }
      >
        <div
          className={
            // !frommultiuser &&
            "w-max px-2 py-12  sm:px-6 lg:px-4 sm:py-10 lg:py-14 bg-background shadow-lg rounded-md"
          }
        >
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-2xl text-text font-bold sm:text-3xl">
              {!frommultiuser
                ? " Incoming Server Settings"
                : "Add user to the app"}
            </h1>
            <p className="mt-4 text-text">
              Register
            </p>
          </div>
          <div className="max-w-xl mx-auto mt-8  mb-0 space-y-4 ">
            <div className="grid grid-cols-2 ">
              <InputField
                label="Email"
                placeholder="Enter Email"
                Icon={MdAlternateEmail}
                value={email}
                updatedValue={setemail}
              />
              <InputField
                label="password"
                placeholder="Enter Password"
                Icon={visible ? MdVisibility : MdVisibilityOff}
                value={password}
                updatedValue={setpassword}
                visible={visible}
                setvisible={setvisible}
              />
            </div>
            <div className="grid grid-cols-1  ">
              <InputField
                label="name"
                placeholder="Enter Name"
                Icon={FiServer}
                value={name}
                updatedValue={setHost}
              />
              {/* <InputField
                label="port"
                placeholder="Enter Imap Port"
                Icon={MdOutlineDoorFront}
                value={port}
                updatedValue={setport}
              /> */}
              {/* <InputField
                label="port"
                placeholder="Enter Smtp Host"
                Icon={FiServer}
                value={smtpHost}
                updatedValue={setsmtpHost}
              />
              <InputField
                label="port"
                placeholder="Enter Smtp Port"
                Icon={MdOutlineDoorFront}
                value={smtpPort}
                updatedValue={setsmtpPort}
              /> */}
            </div>
            <div className="flex items-center justify-center ">
              <Button
                btntext={"Register"}
                handler={onRegisterClick}
              />
            
            <Link
                  to={{ pathname: "/" }}
                  state={'/'}
                >
                  <Button
                btntext={"Login"}
              />
                </Link>
            
          </div>
            {Errors && (
              <span className="font-extrabold text-primary-text mt-4 text-center align-middle ">
                {Errors}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Register;
