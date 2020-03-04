import { getPluginId } from '../../config/utils/getPluginId';
import { getPluginJson } from '../../config/utils/pluginValidation';
import { getCiFolder } from '../../plugins/env';
import path = require('path');
// @ts-ignore
import execa = require('execa');

const ghrPlatform = (): string => {
  switch (process.platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'darwin';
    case 'linux':
      return 'linux';
    default:
      return process.platform;
  }
};

const GHR_VERSION = '0.13.0';
const GHR_ARCH = process.arch === 'x64' ? 'amd64' : '386';
const GHR_PLATFORM = ghrPlatform();
const GHR_EXTENSION = process.platform === 'linux' ? 'tar.gz' : 'zip';
const PUBLISH_DIR = path.resolve(getCiFolder(), 'packages');

class GitHubRelease {
  token: string;
  username: string;
  commitHash: string;
  releaseNotes: string;
  constructor(token: string, username: string, commitHash: string, releaseNotes: string) {
    // Get the ghr binary according to platform
    this.getGhr();
    this.token = token;
    this.username = username;
    this.commitHash = commitHash;
    this.releaseNotes = releaseNotes;
  }

  /**
   * Get the ghr binary to perform the release
   */
  private getGhr() {
    const outName = `./ghr.${GHR_EXTENSION}`;
    const archiveName = `ghr_v${GHR_VERSION}_${GHR_PLATFORM}_${GHR_ARCH}`;
    const ghrUrl = `https://github.com/tcnksm/ghr/releases/download/v${GHR_VERSION}/${archiveName}.${GHR_EXTENSION}`;
    execa.shell(`wget ${ghrUrl} -o ${outName}`);
    if (GHR_EXTENSION === 'tar.gz') {
      execa.shell(`tar zxOvf ${outName} ${archiveName}/ghr > ./ghr`);
    } else {
      execa.shell(`unzip -p ${outName} ${archiveName}/ghr.exe > ./ghr.exe`);
    }
  }

  release() {
    const distDir = path.resolve(process.cwd(), 'dist');
    const pluginVersion = getPluginJson(path.resolve(distDir, 'plugin.json')).info.version;
    execa.shell(`ghr
      -t "${this.token}"
      -u "${this.username}"
      -r "${getPluginId()}"
      -c "${this.commitHash}"
      -n "${getPluginId()}_v${pluginVersion}"
      -b "${this.releaseNotes}"
      -delete
      "v${pluginVersion}"
      ${PUBLISH_DIR}`);
  }
}

export { GitHubRelease };
