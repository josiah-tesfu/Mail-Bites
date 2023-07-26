import { google } from "googleapis";

// call this function in a route using async await
async function setupGmail(accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  // return gmail object. Use this object in later functions here to access/ manipulate gmail data
  return google.gmail({ version: "v1", auth: oauth2Client });
}
