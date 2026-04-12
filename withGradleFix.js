const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withGradleFix(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      // Get the path to gradlew.bat inside the generated android folder
      const gradlewPath = path.join(
        config.modRequest.platformProjectRoot,
        "gradlew.bat",
      );

      if (fs.existsSync(gradlewPath)) {
        let contents = fs.readFileSync(gradlewPath, "utf8");

        // Find the line that clears the CLASSPATH and replace it
        // The 'm' flag makes ^ and $ match the start and end of a line
        contents = contents.replace(/^set CLASSPATH=\r?$/m, "set CLASSPATH=.");

        fs.writeFileSync(gradlewPath, contents);
      }

      return config;
    },
  ]);
};
