export async function getTotalMailInServer(client, path) {
  let lock;
  try {
    await client.connect();
    lock = await client.getMailboxLock(path);
    await client.mailboxOpen(path);
    let status = await client.status(path, { unseen: true, messages: true });
    console.log(status.messages, "status at blah blah", client, path);
    return status.messages;
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    lock.release();
  }
}
