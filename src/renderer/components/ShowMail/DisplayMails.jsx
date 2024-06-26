import { HiOutlineReply } from "react-icons/hi";
import ToolTip from "./ToolTip";
import { useState, useEffect } from "react";
import React from "react";
import { MdAttachment, MdClose } from "react-icons/md";
import AttachMents from "./AttachMents";
import "./MailStyle.css";
import { EditorState } from "draft-js";
import ComposeBox from "./ComposeBox";
const openpgp = require("openpgp");
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
  userHome,
}) {
  let date = new Date(time);
  let attachments = currMail?.attachments;
  // console.log("works on view mail", mailinfo, currMail, text);
  const [editorState, setEditorState] = React.useState(() =>
    EditorState.createEmpty()
  );
  const [forwarding, setForwarding] = useState(false);
  const [isForwardable, setIsForwardable] = useState(true);
  const [passphrase, setPassphrase] = useState("");
  const [mail, setMail] = useState("");
  function fileDownload(file) {
    DownloadAttachMents(file);
  }
  console.log(currMail);
  console.log(mailinfo);
  console.log(mail);
  const fetchMailData = async () => {
    const data = (
      await axios.get(
        `http://0.0.0.0:3000/mail/${mailinfo[6].line.split("Message-ID: ")[1]}`
      )
    ).data;
    console.log("called");
    console.log(data, "mail data from db");
    if (!data) {
      setMail(Html ? Html : text);
      return;
    }
    setIsForwardable(data.forwardable ?? true);

    // privateKey = (
    //   await axios.post(
    //     `http://0.0.0.0:3000/user/private-key/${token.substring(
    //       1,
    //       token.length - 1
    //     )}`
    //   )
    // ).data.privateKey;

    switch (data.depth) {
      case 0:
        setPassphrase("Not necessary");
        setMail(data.content);
        break;
      case 1:
        // setMail(decrypt(data.content, publicKey, "public"));
        break;
      case 2:
        const publicKey = await openpgp.readKey({
          armoredKey: (
            await axios.get(`http://0.0.0.0:3000/user/public-key/${from}`)
          ).data.publicKey,
        });

        const token = localStorage.getItem(`token:${userHome}`);
        const privateKeyArmored = (
          await axios.post(
            `http://0.0.0.0:3000/user/private-key/${token.substring(
              1,
              token.length - 1
            )}`
          )
        ).data.privateKey;
        console.log(privateKeyArmored);
        const privateKey = await openpgp.decryptKey({
          privateKey: await openpgp.readPrivateKey({
            armoredKey: privateKeyArmored,
          }),
          passphrase: passphrase,
        });
        setMail(
          await decrypt(
            data.content.split("Break from here")[0].replace(/<[^>]*>/g, "\n"),
            publicKey,
            privateKey
          )
        );
        break;
      default:
        setMail(Html ? Html : text);
        break;
    }
  };

  useEffect(() => {
    //   const publicKey = (
    //     await axios.get(`http://0.0.0.0:3000/user/public-key/${from}`)
    //   ).data.publicKey;
    //   // console.log(publicKey);
    //   // console.log(Html);
    //   setMail(
    //     Html
    //       ? decrypt(Html, publicKey, "public")
    //       : decrypt(text, publicKey, "public")
    //   );
    console.log(mail, passphrase);
    // if(!mail.length){

    // }
    if (mail.length === 0) fetchMailData();
    // console.log(mail);
  });
  return (
    <>
      {passphrase.length > 0 ? (
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
                  <span className="text-text text-xl capitalize">
                    {username}
                  </span>
                  <div className=" flex-row flex  items-center">
                    {from}
                    <div className="  ">
                      <div className=" ">
                        {console.log(mailinfo)}
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
          <div className="justify-center text-text items-center flex p-4">
            <iframe
              srcDoc={isForwardable ? mail : `<div style="user-select: none; 
              @media print {
                html, body {
                  display: none;
                }
              }">${mail}</div>`}
              className="w-full aspect-video border-0 text-text overflow-y-scroll h-full body"
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
          <div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              {isForwardable && (
                <button
                  onClick={() => setForwarding(!forwarding)}
                  className="inline-block px-5 py-3 mt-8 text-sm font-medium hover:bg-primary bg-primary rounded-tl-2xl rounded-br-2xl text-BannerCardButtonText shadow-lg "
                >
                  Forward
                </button>
              )}
              <div>
                {forwarding && (
                  <ComposeBox
                    editorState={editorState}
                    setEditorState={setEditorState}
                    composeopen={composeopen}
                    setcomposeopen={setcomposeopen}
                    toadress=""
                    subject={"Fwd: " + subject}
                    action="forward"
                    userHome={userHome}
                    message={text.replace(/<[^>]*>/g, "")}
                    setForwarding={setForwarding}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col text-text">
          <div className="flex justify-between">
            <input
              id="passphrase"
              type="text"
              placeholder="Enter passphrase"
              className=" bg-BannerCardBackground  w-full outline-none "
            />
            <button
              className="p-2 bg-BannerCardButtonBackground items-center text-BannerCardButtonText self-end flex font-bold px-2 rounded-md shadow-lg m-2 z-50 "
              onClick={() => {
                setPassphrase(document.getElementById("passphrase").value);
                // setShowPassphraseBox(false);
                // handler();
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </>
  );
}

async function decrypt(body, publicKey, privateKey) {
  console.log(body);
  console.log(publicKey);
  console.log(privateKey);
  const message = await openpgp.readMessage({
    armoredMessage: body, // parse armored message
  });
  const { data: decrypted, signatures } = await openpgp.decrypt({
    message,
    verificationKeys: publicKey, // optional
    decryptionKeys: privateKey,
  });
  try {
    await signatures[0].verified; // throws on invalid signature
    alert("Signature is valid");
  } catch (e) {
    alert("Signature not verified");
  }
  return decrypted;
}

export default DisplayMails;
