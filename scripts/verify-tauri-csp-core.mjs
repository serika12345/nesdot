export const logPredicate = [
  '(process == "nesdot")',
  "||",
  '((process CONTAINS "WebKit") AND (eventMessage CONTAINS[c] "Content Security" || eventMessage CONTAINS[c] "console"))',
].join(" ");

const violationPatterns = Object.freeze([
  /content.?security/u,
  /csp/u,
  /style-src/u,
  /refused to apply/u,
  /refused to load/u,
  /console-error/u,
  /console error/u,
]);

const harmlessPatterns = Object.freeze([
  /Filtering the log data using/u,
  /CFPasteboard/u,
  /Connection invalid/u,
  /sandbox/iu,
  /Operation not permitted/iu,
  /AudioComponentRegistrar/u,
  /coreservicesd/u,
  /RunningBoard/u,
  /AppKit:WindowTab/u,
  /Missing entitlements/u,
  /networkd_settings_read_from_file_locked/u,
  /bootstrap look-up/u,
  /Error registering app with intents framework/u,
  /SLSLogBreak/u,
  /Attempt to connect to launchservicesd prohibited/u,
  /Conn 0x0 is not a valid connection ID/u,
  /Unable to hide query parameters from script/u,
  /invalid product id/u,
  /CRASHSTRING:/u,
  /BoardServices/u,
  /XPCErrorDescription/u,
  /TCC:access/u,
  /appintents:Connection/u,
  /Handshake aborted as the connection has been invalidated/u,
]);

export const findViolationLines = (logLines) => {
  return logLines.filter((line) => {
    const isViolation = violationPatterns.some((pattern) => pattern.test(line));
    const isHarmless = harmlessPatterns.some((pattern) => pattern.test(line));

    return isViolation === true && isHarmless !== true;
  });
};
