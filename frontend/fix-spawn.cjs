// Fix für Node.js 26 Windows spawn EPERM Bug
const cp = require("child_process");
const origSpawn = cp.spawn;
cp.spawn = function(cmd, args, opts) {
  if (typeof cmd === "string" && !cmd.endsWith("cmd.exe") && cmd !== "cmd") {
    return origSpawn("cmd", ["/c", cmd, ...(args || [])], opts);
  }
  return origSpawn(cmd, args, opts);
};
