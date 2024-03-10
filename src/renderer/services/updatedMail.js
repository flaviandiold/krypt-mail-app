const simpleParser = window.require("mailparser").simpleParser;

export async function OnUpdatedMailFromServer(
  client,
  fetchedCount,
  totalMailInServer,
  path
) {
  console.log("ithaan da antha body soda");
  try {
    await client.connect();
    let lock = await client.getMailboxLock(path);
    await client.mailboxOpen(path);
    let status = await client.status(path, { unseen: true, messages: true });
    let total = status.messages;
    let count = 0;
    console.log(total, totalMailInServer);
    let latestmailwithenvelope = [];
    let latestMessagesarray = [];
    if (total > totalMailInServer) {
      for await (let message of client.fetch(
        `${totalMailInServer + 1}:${total}`,
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
        count += 1;
        let obj = {};
        obj.flags = message.flags;
        obj.envelope = message.envelope;
        obj.uid = message.uid;
        obj.labels = message.labels;
        let parsed = await simpleParser(message.source);
        obj.body = parsed;
        latestMessagesarray.push(obj);
        latestmailwithenvelope.push(message.envelope);
        console.log(latestMessagesarray, latestmailwithenvelope);
      }
    }
    console.log(count);
    return { count, latestmailwithenvelope, latestMessagesarray };
  } catch (err) {
    console.log(err);
  } finally {
    await client.logout();
  }
}
