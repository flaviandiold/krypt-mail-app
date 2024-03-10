import { HiOutlineReply } from "react-icons/hi";
import ToolTip from "./ToolTip";
import { useState, useEffect } from "react";
import React from "react";
import { MdAttachment, MdClose } from "react-icons/md";
import AttachMents from "./AttachMents";
import "./MailStyle.css";
const NodeRSA = require("node-rsa");
const axios = require("axios");

function DisplayMails({
  Html,
  subject,
  username,
  time,
  from,
  mailinfo,
  setcomposeopen,
  composeopen,
  setactionFromReply,
  DownloadAttachMents,
  currMail,
  setisAnyMail,
  text,
}) {
  let date = new Date(time);
  let attachments = currMail?.attachments;
  // console.log("works on view mail", mailinfo, currMail, text);
  let [mail, setMail] = useState("");
  function fileDownload(file) {
    DownloadAttachMents(file);
  }
  const fetchMailData = async () => {
    const publicKey = (
      await axios.get(`http://localhost:3000/user/public-key/${from}`)
    ).data.publicKey;
    console.log(publicKey);
    console.log(Html);
    setMail(
      Html
        ? decrypt(Html, publicKey, "public")
        : decrypt(text, publicKey, "public")
    );
    console.log(mail);
  };

  useEffect(() => {
    //   const publicKey = (
    //     await axios.get(`http://localhost:3000/user/public-key/${from}`)
    //   ).data.publicKey;
    //   // console.log(publicKey);
    //   // console.log(Html);
    //   setMail(
    //     Html
    //       ? decrypt(Html, publicKey, "public")
    //       : decrypt(text, publicKey, "public")
    //   );
    fetchMailData();
    // console.log(mail);
  });
  return (
    <div className="flex flex-col text-text">
      <div className="flex justify-between">
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="font-bold text-xl  pt-2">{subject}</span>
            {attachments?.length > 0 && (
              <MdAttachment size={35} className=" pt-2" />
            )}
          </div>
          <span>{date.toString()}</span>
        </div>
        <div>
          <MdClose
            onClick={() => setisAnyMail(false)}
            size={40}
            className=" pt-2 mr-8 cursor-pointer text-text"
          />
        </div>
      </div>
      <div className=" ">
        <div className=" items-center flex  mt-10 justify-between">
          <div className="flex ">
            <div className="h-10 w-10 bg-DisplayMailUserIconBackground rounded-tr-full pt-2 mr-1 items-center justify-center flex shadow-lg">
              <span className="uppercase text-DisplayMailUserIcon font-extrabold">
                {username && username[0] ? username[0] : subject[0]}
              </span>
            </div>
            <div className="flex flex-col ">
              <span className="text-text text-xl capitalize">{username}</span>
              <div className=" flex-row flex  items-center">
                {from}
                <div className="  ">
                  <div className=" ">
                    {mailinfo && <ToolTip mailInfo={mailinfo} />}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex m-2">
            <button
              onClick={() => {
                setcomposeopen(!composeopen);
                if (!composeopen) {
                  setactionFromReply("reply");
                }
              }}
            >
              <HiOutlineReply size={35} className="mr-4 " />
            </button>
          </div>
        </div>
      </div>
      <div className=" justify-center text-text items-center flex p-4">
        <iframe
          srcDoc={mail}
          className="w-full aspect-video border-0  text-text overflow-y-scroll h-full  body"
        />
      </div>
      <div className=" grid grid-cols-2 ">
        {attachments?.map((files) => {
          return (
            <AttachMents
              label={files?.filename}
              type={files?.contentType}
              file={files}
              fileDownload={(clickedfile) => fileDownload(clickedfile)}
            />
          );
        })}
      </div>
    </div>
  );
}

function decrypt(body, key, type) {
  if (body.includes("Break from here")) {
    body = body.split("Break from here")[0];
  }
  if (body.startsWith("<meta")) {
    body = body.substring(body.indexOf(">") + 1, body.length);
  }
  console.log(body);
  // console.log(key);
  const decryptKey = new NodeRSA(key, type);
  let result;
  switch (type) {
    case "public":
      console.log("decrypting with public key");
      result = decryptKey.decryptPublic(body, "utf8");
      break;
    case "private":
      console.log("decrypting with private key");
      result = decryptKey.decrypt(body, "utf8");
      break;
    default:
      console.log("decrypting with private key");
      result = decryptKey.decrypt(body, "utf8");
  }
  console.log(result);
  return result;
}

export default DisplayMails;
