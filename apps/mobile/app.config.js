// eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo evaluates app.config.js as CommonJS.
const { expo: staticConfig } = require("./app.json");

const TAILSCALE_ATS_CIDR = "100.64.0.0/10";

module.exports = ({ config }) => {
  const development = process.env.APP_VARIANT === "development";
  const mergedConfig = {
    ...staticConfig,
    ...config,
    ios: {
      ...staticConfig.ios,
      ...config.ios,
    },
  };
  const ios = { ...mergedConfig.ios };

  if (development) {
    ios.infoPlist = {
      ...(staticConfig.ios.infoPlist ?? {}),
      NSAppTransportSecurity: {
        ...(staticConfig.ios.infoPlist?.NSAppTransportSecurity ?? {}),
        NSExceptionDomains: {
          ...(staticConfig.ios.infoPlist?.NSAppTransportSecurity?.NSExceptionDomains ?? {}),
          [TAILSCALE_ATS_CIDR]: {
            NSExceptionAllowsInsecureHTTPLoads: true,
          },
        },
      },
    };
  }

  return {
    ...mergedConfig,
    ios,
  };
};
