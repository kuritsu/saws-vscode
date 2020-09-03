// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const saws = require('./saws');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('SAWS is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('saws.getAWSResourceInfo', async function () {
		// The code you place here will be executed every time your command is executed
		let i = 0;
		// Display a message box to the user
		const keys = Object.keys(saws.CMDS);
		const cmd = await vscode.window.showQuickPick(keys, {
			placeHolder: 'select resource type'
		});
		let lastProfile = context.globalState.get("saws:lastProfile") || "";
		const profile = await vscode.window.showInputBox({
			placeHolder: 'enter profile name',
			value: lastProfile
		});
		if (!profile)
			return;
		context.globalState.update("saws:lastProfile", profile);
		const getDetail = await vscode.window.showQuickPick(['no', 'yes'], {
			placeHolder: 'get details'
		});
		var resources = saws.execute(cmd, profile, getDetail === 'yes');
		var resourceList = resources;
		console.log(`Total objects: ${resources.length}.`);
		if (getDetail === 'yes') {
			resourceList = resourceList.map((r) => r._info);
		}
		let resource = await vscode.window.showQuickPick(resourceList, {
			placeHolder: ''
		});
		if (getDetail === 'yes') {
			resource = resources.find(e => e._info === resource);
			resource = JSON.stringify(resource, null, " ");
		}
		const editor = vscode.window.activeTextEditor;
		if (vscode.window.activeTextEditor) {
			vscode.window.activeTextEditor.edit(editBuilder => editBuilder.insert(editor.selection.start, resource));
		} else {
			vscode.env.clipboard.writeText(resource);
		}
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}