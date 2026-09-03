/* READ-ONLY Google Cloud Logging entries.list request. */
const {GoogleAuth} = require('/Users/dantt1002/projects/subscriptions/node_modules/google-auth-library');
const keyFile = '/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json';
const auth = new GoogleAuth({keyFile, scopes: ['https://www.googleapis.com/auth/logging.read']});
const filter = `timestamp >= "2026-09-03T01:53:20Z" AND timestamp <= "2026-09-03T01:54:00Z" AND SEARCH("9tshlof15k0w")`;
(async () => {
  const client = await auth.getClient();
  const body = {resourceNames: ['projects/avada-subscription-app'], filter, orderBy: 'timestamp asc', pageSize: 100};
  console.log('REQUEST (verbatim): POST https://logging.googleapis.com/v2/entries:list');
  console.log('BODY (verbatim):\n' + JSON.stringify(body, null, 2));
  const response = await client.request({url: 'https://logging.googleapis.com/v2/entries:list', method: 'POST', data: body});
  const entries = (response.data.entries || []).map(e => ({timestamp: e.timestamp, severity: e.severity, logName: e.logName, resource: e.resource, textPayload: e.textPayload, jsonPayload: e.jsonPayload, labels: e.labels}));
  console.log('RESULT COUNT:', entries.length);
  console.log(JSON.stringify(entries, null, 2));
})().catch(error => {console.error(error.response?.data || error); process.exitCode = 1;});
