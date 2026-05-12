import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://977fb1af3ea584e69c3dbea2edf7ec71@o4511369441574912.ingest.us.sentry.io/4511370553327616",
  sendDefaultPii: true,
});

export default Sentry;