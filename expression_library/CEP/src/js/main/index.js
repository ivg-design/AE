const { CSInterface } = require("cep-api");
const { Folder, SystemPath } = require("cep-utils");

const revealBtn = document.getElementById("reveal-btn");
revealBtn.addEventListener("click", revealLibrary);

function revealLibrary() {
    const csInterface = new CSInterface();
    const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
    const libFolderPath = `${extensionPath}/lib`;

    const folder = new Folder(libFolderPath);
    if (!folder.exists) {
        folder.create();
    }

    folder.showInFinder();
}