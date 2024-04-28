import { convertToHTML } from "draft-convert";
import { convertToRaw, ContentState, EditorState } from "draft-js";
import React, { useEffect, useState } from "react";
import { Editor } from "react-draft-wysiwyg";
import { MdCancel, MdInput, MdStyle, MdTextFields } from "react-icons/md";
import { RiSendPlaneLine } from "react-icons/ri";
import { Resizable } from "re-resizable";
import { readFile } from "../../lib/fileAction";
import { v4 } from "uuid";
const openpgp = require("openpgp");

const axios = require("axios");

const nodemailer = window.require("nodemailer");
const path = require("path");
function ComposeBox({
  editorState,
  setEditorState,
  composeopen,
  setcomposeopen,
  toadress,
  subject,
  action,
  userHome,
  message,
  setForwarding,
}) {
  const [depth, setDepth] = useState(0);
  console.log(depth, "depth");
  const [toAddress, settoAdress] = React.useState(toadress);
  const [passphrase, setPassphrase] = useState("");
  const [Subject, setSubject] = React.useState(subject);
  const [body, setbody] = React.useState("");
  const [showPassphraseBox, setShowPassphraseBox] = useState(false);
  // console.log(body);
  const [styledtext, setstyledtext] = useState(false);
  const blocks = convertToRaw(editorState?.getCurrentContent()).blocks;
  const [isDisabled, setisDisabled] = useState(false);
  const [encryptIsDisabled, setEncryptIsDisabled] = useState(false);
  const [showPuKey, setShowPuKey] = useState(false);
  const [encryption, setEncryption] = useState(false);
  const [cancelForwarding, setCancelForwarding] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const publicKey = { data: "" };
  const value = blocks
    .map((block) => (!block.text.trim() && "\n") || block.text)
    .join("\n");
  const [File, setFile] = useState([]);
  const convertContentToHTML = () => {
    const currentContentAsHTML = convertToHTML(
      editorState?.getCurrentContent()
    );
    console.log(currentContentAsHTML);
    setbody(currentContentAsHTML);
  };

  useEffect(() => {
    convertContentToHTML();
  }, [value]);

  useEffect(() => {
    const contentState = ContentState.createFromText(body);
    setEditorState(
      EditorState.push(editorState, contentState, "replace-content")
    );
    convertContentToHTML();
  }, [encryption]);

  const encryptHandler = async (
    body,
    setbody,
    setShowPuKey,
    setisDisabled,
    userHome,
    toAddress,
    setEncryption,
    setDepth,
    externalEncrypt,
    passphrase
  ) => {
    // let privateKey = localStorage.getItem(`privateKey:${userHome}`);

    const token = localStorage.getItem(`token:${userHome}`);
    const privateKey = (
      await axios.post(
        `http://0.0.0.0:3000/user/private-key/${token.substring(
          1,
          token.length - 1
        )}`
      )
    ).data.privateKey;
    // localStorage.setItem(`privateKey:${userHome}`, privateKey);

    // console.log(privateKey);
    // let temp = "";
    // for (let i = 0; i < privateKey.length - 1; i++) {
    //   if (privateKey.charAt(i) === "\\" && privateKey.charAt(i + 1) === "n") {
    //     i++;
    //     continue;
    //   }
    //   temp = temp + privateKey.charAt(i);
    // }
    // privateKey = privateKey.replace(/"/g, "");
    // privateKey = privateKey.substring(1, privateKey.length - 2);
    // privateKey = privateKey.replace(/\\[rtfbv]/g, "");
    // console.log(privateKey);

    // const decipher = crypto.createDecipheriv(algorithm, aes_key, iv);

    // let decrypted = decipher.update(privateKey, "base64url", "utf8");
    // // decrypted += decipher.final("utf-8");
    // privateKey = decrypted;

    // privateKey = privateKey.substring(0, privateKey.lastIndexOf("-") + 1);
    if (!externalEncrypt) {
      let publicKey = (
        await axios.get(`http://0.0.0.0:3000/user/public-key/${toAddress}`)
      ).data.publicKey;
      // console.log(toAddress, publicKey);
      if (!publicKey) {
        alert(
          "The recipient is not a registered KryptMail user, you can risk sending it without encryption or enter their public key below"
        );
        setShowPuKey(true);
        setisDisabled(true);
      } else {
        body = await encrypt(privateKey, publicKey, passphrase, body);
        const html =
          body +
          'Break from here <br><p>If you are using a different client other than KryptMail try using <a href="https://www.freecodecamp.org/" target="_blank" rel="noopener noreferrer">this</a> link.</p>';
        setbody(html);
        setEncryption(true);
        setDepth(2);
      }
    } else {
      if (password.length) {
        console.log(passphrase, password);
        body = await encrypt(privateKey, null, passphrase, body, password);
        setbody(body);
        setEncryption(true);
        setDepth(1);
      } else {
        setShowPasswordBox(true);
      }
    }
  };

  const storeMail = async ({
    messageId,
    to,
    from,
    content,
    depth,
    forwardable = true,
    timecode = -1, // month, hour, sec, days
    timeframe = -1, // how long
  }) => {
    content = content.replace(/<[^>]*>/g, "\n");
    // while (true) {
    const success = (
      await axios.post(`http://0.0.0.0:3000/mail`, {
        messageId,
        to,
        from,
        content,
        depth,
        forwardable,
        timecode,
        timeframe,
      })
    ).data.success;
    // if (success) break;
    // }
  };

  async function SendPublicKey(
    toAddress,
    publicKey,
    setShowPuKey,
    setisDisabled
  ) {
    console.log(toAddress, publicKey);
    await axios.post(`http://0.0.0.0:3000/user/public-key/${toAddress}`, {
      publicKey: publicKey["data"],
    });
    setShowPuKey(false);
    setisDisabled(false);
  }

  const encrypt = async (
    privateKeyArmored,
    publicKeyArmored,
    passphrase,
    body,
    password
  ) => {
    if (publicKeyArmored) {
      // privateKey = privateKey.replace(/\\[rntfbv]|"/g, "");
      // const privateKeyMidBlock = privateKey
      //   .split("-----BEGIN PGP PRIVATE KEY BLOCK-----")[1]
      //   .split("-----END PGP PRIVATE KEY BLOCK-----")[0];
      // privateKey = `
      // -----BEGIN PGP PRIVATE KEY BLOCK-----

      // ${privateKeyMidBlock}
      // -----END PGP PRIVATE KEY BLOCK-----`;
      console.log(privateKeyArmored);
      console.log(publicKeyArmored);
      console.log(passphrase);
      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({
          armoredKey: privateKeyArmored,
        }),
        passphrase: passphrase,
      });
      console.log("private is not misformed");
      const publicKey = await openpgp.readKey({
        armoredKey: publicKeyArmored,
      });
      const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: body }), // input as Message object
        encryptionKeys: publicKey,
        signingKeys: privateKey, // optional
      });

      return encrypted;
    } else {
      if (!passphrase || !passphrase.length) {
        setShowPassphraseBox(true);
        return body;
      } else {
        console.log(passphrase, password);

        const privateKey = await openpgp.decryptKey({
          privateKey: await openpgp.readPrivateKey({
            armoredKey: privateKeyArmored,
          }),
          passphrase: passphrase,
        });
        const encrypted = await openpgp.encrypt({
          message: await openpgp.createMessage({ text: body }), // input as Message object
          passwords: password,
          signingKeys: privateKey,
        });

        return encrypted;
      }
    }
  };

  const SendMail = async (
    toAddress,
    subject,
    body,
    fileUri,
    setFile,
    userHome,
    setisDisabled,
    depth,
    cancelForwarding,
    externalEncrypt
  ) => {
    setisDisabled(true);
    const conf = JSON.parse(readFile(path.join(userHome, "smtp.txt")))
      ? JSON.parse(readFile(path.join(userHome, "smtp.txt")))
      : null;
    const transporter = nodemailer.createTransport(conf);
    let content = null;
    let token;
    if (
      externalEncrypt ||
      (cancelForwarding && !toAddress.includes("kryptmail.com"))
    ) {
      content = body;
      token = v4();
      body = `Open this <a href="http://localhost:8080/?messageId=${token}" target="_blank" rel="noopener noreferrer">link</a> to view the mail`;
    }
    let mailOptions = {
      from: userHome,
      to: toAddress,
      subject: subject,
      text: content ? body : body.replace(/<[^>]*>/g, "\n"),
      html: content ? body : body.replace(/<[^>]*>/g, "\n"),
      attachments: fileUri?.length > 0 ? fileUri : false,
    };
    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        alert("error sending mail");
        setisDisabled(false);
      } else {
        alert("message sent successfully");
        console.log(cancelForwarding, "skjndvjsd");
        await storeMail({
          messageId: token ? token : info.messageId,
          to: toAddress,
          from: userHome,
          content: content ? content : body,
          depth: depth,
          forwardable: !cancelForwarding,
        });
        setFile([]);
        transporter.close();
        setisDisabled(false);
      }
    });
  };

  const uploadCallback = (file, callback) => {
    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();
      reader.onloadend = async () => {
        let obj = {};
        obj.path = file?.path;
        obj.filename = file?.name;
        setFile((prevData) => [...prevData, obj]);
        resolve({ data: { link: URL.createObjectURL(file) } });
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <Resizable className=" text-BannerCardText  mt-4 bg-BannerCardBackground overflow-hidden flex flex-col z-50 rounded-lg shadow-lg   ">
      <div>
        <div className="  flex justify-between w-full   rounded-2xl">
          <span className="m-2">Compose Box</span>
          {action === "forward" ? (
            <button
              className="m-2"
              onClick={() => {
                setForwarding(false);
              }}
            >
              <MdCancel size={25} className="" />
            </button>
          ) : (
            <button
              className="m-2"
              onClick={() => setcomposeopen(!composeopen)}
            >
              <MdCancel size={25} className="" />
            </button>
          )}
        </div>
      </div>
      <div className="p-2 border-b border-b-SideBarBackground  m-2 mx-2   flex">
        <span className="mr-2 ">To:</span>
        <input
          type="text"
          className=" w-full   bg-BannerCardBackground outline-none "
          value={toAddress}
          onChange={(e) => {
            if (action == "newcompose") {
              settoAdress(e.target.value);
            }
          }}
          placeholder="type to address "
        />
      </div>
      <div className="p-2  mx-2  flex">
        <span className="mr-2 ">Subject:</span>
        <input
          type="text"
          value={Subject}
          onChange={(e) => {
            if (action == "newcompose") {
              setSubject(e.target.value);
            }
          }}
          placeholder="type mail subject here"
          className=" bg-BannerCardBackground  w-full outline-none "
        />
      </div>
      <div className="grow p-2 mx-2 max-h-full grid  rounded-2xl text-text text-opacity-70   ">
        {action === "forward" ? (
          <Editor
            placeholder={message}
            editorState={editorState}
            defaultEditorState={editorState}
            onEditorStateChange={setEditorState}
            toolbarClassName=""
            toolbarHidden={!styledtext}
            toolbar={{
              options: [
                "inline",
                "fontSize",
                "fontFamily",
                "image",
                "list",
                "textAlign",
                "emoji",
                "remove",
                "history",
              ],
              image: {
                previewImage: true,
                uploadEnabled: true,
                urlEnabled: false,
                uploadCallback: uploadCallback,
                defaultSize: {
                  height: 100,
                  width: 100,
                },
                alignmentEnabled: true,
              },
            }}
            editorClassName="bg-BannerCardBackground text-BannerCardText scroll-smooth   scrollbar-thin  scrollbar-thumb-primary scrollbar-track-windowBarBackground  scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
            wrapperClassName=""
            className="opacity-70 max-w-full  
                max-h-full 
                "
            wrapperStyle={{
              height: 300,
            }}
            editorStyle={{
              width: "100%",
            }}
            toolbarCustomButtons={[
              <SendBtn
                text={"Send"}
                handler={() =>
                  SendMail(
                    toAddress,
                    Subject,
                    message,
                    File,
                    setFile,
                    userHome,
                    setisDisabled,
                    depth,
                    cancelForwarding,
                    false
                  )
                }
                isdisabled={isDisabled}
                setisDisabled={setisDisabled}
              />,
            ]}
          />
        ) : (
          <Editor
            editorState={editorState}
            defaultEditorState={editorState}
            onEditorStateChange={setEditorState}
            toolbarClassName=""
            toolbarHidden={!styledtext}
            toolbar={{
              options: [
                "inline",
                "fontSize",
                "fontFamily",
                "image",
                "list",
                "textAlign",
                "emoji",
                "remove",
                "history",
              ],
              image: {
                previewImage: true,
                uploadEnabled: true,
                urlEnabled: false,
                uploadCallback: uploadCallback,
                defaultSize: {
                  height: 100,
                  width: 100,
                },
                alignmentEnabled: true,
              },
            }}
            editorClassName="bg-BannerCardBackground text-BannerCardText scroll-smooth   scrollbar-thin  scrollbar-thumb-primary scrollbar-track-windowBarBackground  scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
            wrapperClassName=""
            className="opacity-70 max-w-full  
                max-h-full 
                "
            wrapperStyle={{
              height: 300,
              width: 1000,
            }}
            placeholder="Type your mail body"
            editorStyle={{
              width: "100%",
            }}
            toolbarCustomButtons={[
              <SendBtn
                handler={() =>
                  SendMail(
                    toAddress,
                    Subject,
                    body,
                    File,
                    setFile,
                    userHome,
                    setisDisabled,
                    depth,
                    cancelForwarding,
                    false
                  )
                }
                isdisabled={isDisabled}
                setisDisabled={setisDisabled}
              />,
            ]}
          />
        )}
        <div>
          {!styledtext && !showPuKey && (
            <>
              <EncryptBtn
                text={"Encrypt"}
                handler={() => {
                  if (passphrase.length > 0) {
                    encryptHandler(
                      body,
                      setbody,
                      setShowPuKey,
                      setisDisabled,
                      userHome,
                      toAddress,
                      setEncryption,
                      setDepth,
                      false,
                      passphrase
                    );
                  } else {
                    console.log("here");
                    setShowPassphraseBox(true);
                  }
                }}
                isDisabled={encryptIsDisabled}
                setisDisabled={setEncryptIsDisabled}
              />
              {showPassphraseBox && (
                <div className="">
                  <input
                    id="passphrase"
                    type="text"
                    placeholder="Enter passphrase"
                    className=" bg-BannerCardBackground  w-full outline-none "
                  />
                  <button
                    className="p-2 bg-BannerCardButtonBackground items-center text-BannerCardButtonText self-end flex font-bold px-2 rounded-md shadow-lg m-2 z-50 "
                    onClick={() => {
                      setPassphrase(
                        document.getElementById("passphrase").value
                      );
                      setShowPassphraseBox(false);
                      // handler();
                    }}
                  >
                    Submit
                  </button>
                </div>
              )}
              {cancelForwarding ? (
                <ForwardConfBtn
                  text={"Allow Forwarding"}
                  handler={() => {
                    setCancelForwarding(false);
                  }}
                />
              ) : (
                <ForwardConfBtn
                  text={"Cancel Forwarding"}
                  handler={() => {
                    setCancelForwarding(true);
                  }}
                />
              )}
              <SendBtn
                handler={() => {
                  SendMail(
                    toAddress,
                    Subject,
                    body,
                    File,
                    setFile,
                    userHome,
                    setisDisabled,
                    depth,
                    cancelForwarding,
                    false
                  );
                }}
                isdisabled={isDisabled}
                setisDisabled={setisDisabled}
              />
            </>
          )}
        </div>
      </div>
      {showPuKey && (
        <div>
          <EncryptBtn
            text={"External Encrypt"}
            handler={() =>
              encryptHandler(
                body,
                setbody,
                setShowPuKey,
                setisDisabled,
                userHome,
                toAddress,
                setEncryption,
                setDepth,
                true,
                passphrase
              )
            }
            isdisabled={isDisabled}
            setisDisabled={setisDisabled}
          />
          {showPassphraseBox && (
            <div className="">
              <input
                id="passphrase"
                type="text"
                placeholder="Enter passphrase"
                className=" bg-BannerCardBackground  w-full outline-none "
              />
              <button
                className="p-2 bg-BannerCardButtonBackground items-center text-BannerCardButtonText self-end flex font-bold px-2 rounded-md shadow-lg m-2 z-50 "
                onClick={() => {
                  console.log(document.getElementById("passphrase").value);
                  setPassphrase(document.getElementById("passphrase").value);
                  setShowPassphraseBox(false);
                  // handler();
                }}
              >
                Submit
              </button>
            </div>
          )}
          {showPasswordBox && (
            <div className="">
              <input
                id="passwordE2E"
                type="text"
                placeholder="Enter password"
                className=" bg-BannerCardBackground  w-full outline-none "
              />
              <button
                className="p-2 bg-BannerCardButtonBackground items-center text-BannerCardButtonText self-end flex font-bold px-2 rounded-md shadow-lg m-2 z-50 "
                onClick={() => {
                  setPassword(document.getElementById("passwordE2E").value);
                  setShowPasswordBox(false);
                  // handler();
                }}
              >
                Submit
              </button>
            </div>
          )}
          {cancelForwarding ? (
            <ForwardConfBtn
              text={"Allow Forwarding"}
              handler={() => {
                setCancelForwarding(false);
              }}
            />
          ) : (
            <ForwardConfBtn
              text={"Cancel Forwarding"}
              handler={() => {
                setCancelForwarding(true);
              }}
            />
          )}
          <SendBtn
            text={"Encrypt and Send"}
            handler={() =>
              SendMail(
                toAddress,
                Subject,
                body,
                File,
                setFile,
                userHome,
                setisDisabled,
                depth,
                cancelForwarding,
                true
              )
            }
          />
          <AddPublicKey
            text={"Add public key"}
            handler={() =>
              SendPublicKey(toAddress, publicKey, setShowPuKey, setisDisabled)
            }
            publicKey={publicKey}
          />
        </div>
      )}
    </Resizable>
  );
}

export default ComposeBox;

function SendBtn({ handler, isdisabled }) {
  return (
    <div>
      <button
        className="p-2 bg-BannerCardButtonBackground items-center text-BannerCardButtonText self-end flex font-bold px-2 rounded-md shadow-lg m-2 z-50 "
        onClick={handler}
        disabled={isdisabled}
      >
        Send
        <RiSendPlaneLine size={25} className="  text-BannerCardButtonText " />
      </button>
    </div>
  );
}

function AddPublicKey({ handler, text, publicKey }) {
  return (
    <div className="">
      <span className="mr-2 ">Public Key:</span>
      <input
        id="publicKey"
        type="text"
        placeholder={text}
        // onChange={(e) => {
        //   console.log(e);
        //   publicKey.data += e.nativeEvent.data;
        // }}
        className=" bg-BannerCardBackground  w-full outline-none "
      />
      <button
        className="p-2 bg-BannerCardButtonBackground items-center text-BannerCardButtonText self-end flex font-bold px-2 rounded-md shadow-lg m-2 z-50 "
        onClick={() => {
          publicKey.data = document.getElementById("publicKey").value;

          handler();
        }}
      >
        Add Public Key
      </button>
    </div>
  );
}

function EncryptBtn({ text, handler, isDisabled }) {
  return (
    <div>
      <button
        className="p-2 bg-BannerCardButtonBackground items-center text-BannerCardButtonText self-end flex font-bold px-2 rounded-md shadow-lg m-2 z-50 "
        onClick={handler}
        disabled={isDisabled}
      >
        {text}
      </button>
    </div>
  );
}

function ForwardConfBtn({ text, handler }) {
  return (
    <div>
      <button
        className="p-2 bg-BannerCardButtonBackground items-center text-BannerCardButtonText self-end flex font-bold px-2 rounded-md shadow-lg m-2 z-50 "
        onClick={handler}
      >
        {text}
      </button>
    </div>
  );
}
