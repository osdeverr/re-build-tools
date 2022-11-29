// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { CppToolsApi, Version, getCppToolsApi } from 'vscode-cpptools';

import { ReCppConfigurationProvider } from './cpptools';

const reConfigProvider = new ReCppConfigurationProvider();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "re-build-tools" is now active!');
	
	let api: CppToolsApi | undefined = await getCppToolsApi(Version.latest);
	
    if (api) {
        if (api.notifyReady) {
            // Inform cpptools that a custom config provider will be able to service the current workspace.
            api.registerCustomConfigurationProvider(reConfigProvider);

            // Do any required setup that the provider needs.

            // Notify cpptools that the provider is ready to provide IntelliSense configurations.
            api.notifyReady(reConfigProvider);
        } else {
            // Running on a version of cpptools that doesn't support v2 yet.
            
            // Do any required setup that the provider needs.

            // Inform cpptools that a custom config provider will be able to service the current workspace.
            api.registerCustomConfigurationProvider(reConfigProvider);
            api.didChangeCustomConfiguration(reConfigProvider);
        }
    }
    // Dispose of the 'api' in your extension's deactivate() method, or whenever you want to unregister the provider.

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('re-build-tools.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Re Build Tools!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
