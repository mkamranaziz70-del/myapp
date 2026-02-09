import admin from "../firebase";

export async function sendPush(
  token: string,
  title: string,
  body: string,
  jobId?: string
) {
  if (!token) return;

  await admin.messaging().send({
    token,
    notification: {
      title,
      body,
    },
    data: {
      jobId: jobId || "",
      screen: "EmployeeJobDetail",
    },
    android: {
      notification: {
        channelId: "default",
        sound: "default",
      },
    },
  });
}
