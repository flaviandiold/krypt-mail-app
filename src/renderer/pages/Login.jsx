import React, { useState, useEffect } from "react";
import {
  MdAlternateEmail,
  MdOutlineDoorFront,
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
import { setUser, setUsersList } from "../redux/actions/UserActions";
import { Link } from "react-router-dom";
// import * as encoder from "bcrypt";

const axios = require("axios");

const { ImapFlow } = require("imapflow");
const path = require("path");
const pino = require("pino")();
pino.level = "silent";

// const location = useLocation();

function Login({ frommultiuser }) {
  let [email, setemail] = useState("");
  let [password, setpassword] = useState("");
  const [visible, setvisible] = useState(true);
  const [Errors, setErrors] = useState("");
  const [securesmtp] = useState(true);
  let client;
  const dispatch = useDispatch();

  const imapObj = {
    secure: true,
    logger: pino,
    tls: {
      rejectUnauthorized: false,
    },
    auth: {
      user: "",
      pass: "",
      accessToken: null,
    },
  };

  let smtpobj = {
    tls: {
      rejectUnauthorized: false,
    },
    auth: {
      user: "",
      pass: "",
    },
  };

  useEffect(() => {
    dispatch(setLoading(false));
    if (!frommultiuser) {
      applyTheme("Light");
    }
    return () => {};
  }, []);

  function onResultTrue(email, imapObj) {
    if (checkExists("")) {
      if (checkExists(email)) {
        StoreInfo(email, imapObj);
      } else {
        createFolder(email);
        createFolder(path.join(email, "conf"));
        StoreInfo(email, imapObj);
      }
    } else {
      createFolder("");
      createFolder(email);
      createFolder(path.join(email, "conf"));
      StoreInfo(email, imapObj);
    }
  }

  const onLoginClick = async () => {
    console.log("comes here login/add user");
    try {
      dispatch(setLoading(true));
      if (!email || !password) {
        setErrors("input fields cannot be empty");
        dispatch(setLoading(false));
      } else {
        email = email.includes("@") ? email : email + "@kryptmail.com";
        (imapObj.auth.user = smtpobj.auth.user = email),
          (imapObj.auth.pass = smtpobj.auth.pass = password);
        const domain = email.split("@")[1]
          ? email.split("@")[1]
          : "kryptmail.com";
        const serverDetails = ManualSetup[domain];
        imapObj.host = serverDetails["imap-host"];
        imapObj.port = serverDetails["imap-port"];
        smtpobj.host = serverDetails["smtp-host"];
        smtpobj.port = serverDetails["smtp-port"];
        console.log(imapObj, smtpobj, "login details");
        if (validateEmail(email)) {
          try {
            client = new ImapFlow(imapObj);
            let result = await LogintoAccount(client);
            if (result == true) {
              console.log(imapObj);
              // password = await encoder.hash(password, 10);
              const data = (
                await axios.post("http://0.0.0.0:3000/user/register", {
                  email,
                  password,
                })
              ).data;
              console.log(data.privateKey, data.token);
              if (!localStorage.getItem(`privateKey:${email}`)) {
                localStorage.setItem(
                  `privateKey:${email}`,
                  JSON.stringify(data.privateKey)
                );
              }
              if (!localStorage.getItem(`token:${email}`)) {
                localStorage.setItem(
                  `token:${email}`,
                  JSON.stringify(data.token)
                );
              }
              console.log(localStorage);
              onResultTrue(email, imapObj);
            } else {
              setErrors("invalid credentials or configuration of your mail");
              dispatch(setLoading(false));
            }
          } catch (error) {
            console.log(error);
            setErrors("something went wrong while logging in");
            dispatch(setLoading(false));
          }
        } else {
          setErrors("Email is not properly structured");
          dispatch(setLoading(false));
        }
      }
    } catch (error) {
      alert(error);
    }
  };

  function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  function StoreInfo(email, imapObj) {
    let accountexists = false;
    let userslist = JSON.parse(readFile("userslist"));
    if (userslist?.length > 0) {
      let obj = userslist.find((o, i) => {
        if (o?.auth?.user === imapObj?.auth?.user) {
          alert("account already exists");
          accountexists = true;
          dispatch(setLoading(false));
          return true;
        }
      });
      if (!accountexists) {
        userslist?.push(imapObj);
        WriteFile(path.join("userslist"), userslist);
      }
    } else {
      let usersarray = [];
      usersarray[0] = imapObj;
      userslist = usersarray;
      WriteFile(path.join("userslist"), usersarray);
    }
    dispatch(setUsersList(userslist));
    if (frommultiuser) {
      dispatch(setUser(imapObj));
    }
    if (!accountexists) {
      // smtpobj = imapObj;
      WriteFile(path.join(email, "user.txt"), imapObj);
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
          !frommultiuser
            ? "relative flex flex-wrap lg:h-[calc(100vh_-_2rem)] bg['/src/main/helpers/assets/LoginBg.jpg'] lg:items-center justify-center text-text  bg-cover "
            : ""
        }
      >
        <div
          className={
            !frommultiuser &&
            "w-max px-2 py-12  sm:px-6 lg:px-4 sm:py-10 lg:py-14 bg-background shadow-lg rounded-md"
          }
        >
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-2xl text-text font-bold sm:text-3xl">
              {!frommultiuser
                ? " Incoming Server Settings"
                : "Add user to the app"}
            </h1>
            <p className="mt-4 text-text">Login</p>
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
            {/* <div className="grid grid-cols-2  ">
              <InputField
                label="host"
                placeholder="Enter Imap Host"
                Icon={FiServer}
                value={Host}
                updatedValue={setHost}
              />
              <InputField
                label="port"
                placeholder="Enter Imap Port"
                Icon={MdOutlineDoorFront}
                value={port}
                updatedValue={setport}
              />
              <InputField
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
              />
            </div> */}
            <div className="flex items-center justify-center ">
              <Button
                btntext={frommultiuser ? "Add User" : "Login"}
                handler={onLoginClick}
              />

              {/* <Link to={{ pathname: "/register" }} state={"/register"}>
                <Button btntext={"Register"} />
              </Link> */}
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

export default Login;
