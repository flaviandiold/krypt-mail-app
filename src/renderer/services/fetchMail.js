const simpleParser = window.require("mailparser").simpleParser;

export async function FetchMail(
  client,
  fetchLimit,
  fetchedCount,
  withlimit,
  again,
  totalMailInServer,
  path
) {
  console.log("enters");
  await client.connect();
  console.log("connected in fetch mail");
  let lock = await client.getMailboxLock(path);
  try {
    await client.mailboxOpen(path);
    let status = await client.status(path, { unseen: true, messages: true });
    console.log(status, "status");
    let decreasedCount, count, totalCount;
    if (withlimit == true) {
      count = status.messages;
      totalCount = again ? count - fetchedCount : count;
      decreasedCount = again
        ? totalCount - fetchLimit
        : totalCount - fetchLimit;
    } else {
      totalCount = again ? totalCount - fetchedCount : status.messages;
      decreasedCount = again
        ? totalCount - fetchLimit
        : totalCount - fetchLimit > -1
        ? totalCount - fetchLimit
        : 0;
    }
    if (decreasedCount < 0) {
      decreasedCount = 0;
    }
    console.log(
      decreasedCount,
      count,
      totalCount,
      totalCount - fetchLimit,
      fetchLimit,
      "stats"
    );
    totalMailInServer = totalCount;
    let Messagesarray = [];
    let envelopearray = [];
    for await (let message of client.fetch(
      `${decreasedCount + 1}:${totalCount}`,
      {
        envelope: true,
        source: true,
        flags: true,
        status: true,
        labels: true,
        uid: true,
        new: true,
      }
    )) {
      console.log("loops");
      let obj = {};
      let envelopeobj = {};
      envelopeobj = message.envelope;
      obj.flags = message.flags;
      obj.envelope = message.envelope;
      obj.uid = message.uid;
      obj.labels = message.labels;
      let parsed = await simpleParser(message.source);
      obj.body = parsed;
      envelopearray.push(envelopeobj);
      Messagesarray.push(obj);
    }
    console.log("returns", Messagesarray, envelopearray);
    return { Messagesarray, envelopearray, status };
  } catch (err) {
    console.log(err);
  } finally {
    lock.release();
  }
  await client.logout();
}
