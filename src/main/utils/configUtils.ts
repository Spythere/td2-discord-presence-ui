import { readFileSync, readdirSync } from 'fs'
import path from 'path'

export function _getTd2ConfigUsername(appDataPath: string) {
  let dirPath = path.resolve(appDataPath, '..', 'Local', 'TTSK')

  const ttskFiles = readdirSync(dirPath)

  if (ttskFiles.length > 0) {
    dirPath = path.resolve(dirPath, ttskFiles[0])
    const launcherFiles = readdirSync(dirPath)

    if (launcherFiles.length > 0) {
      dirPath = path.resolve(dirPath, launcherFiles[0])
      const versionFiles = readdirSync(dirPath)

      if (versionFiles.includes('user.config')) {
        dirPath = path.resolve(dirPath, 'user.config')

        const configFile = readFileSync(dirPath, { encoding: 'utf-8' })

        if (configFile) {
          const splitted = configFile.split('</setting>')[2]
          const usernameValue = splitted.split('<value>')

          if (usernameValue.length > 1) {
            return usernameValue[1]
              .split('</value>')[0]
              .replace(/[a-z]/gi, (char) =>
                String.fromCharCode(char.charCodeAt(0) + (char.toLowerCase() <= 'm' ? 13 : -13))
              )
          }
        }
      }
    }
  }

  return null
}
