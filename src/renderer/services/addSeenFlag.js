export async function AddSeenFlag(connection, uid, path) {
  console.log("adds seen flag on server");
  await connection.connect();
  let mailbox = await connection.mailboxOpen(path);
  let lock = await connection.getMailboxLock(path);
  try {
    await connection.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
  } catch (er) {
  } finally {
    lock.release();
  }
  await connection.logout();
}
