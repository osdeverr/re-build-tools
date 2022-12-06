// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { CppToolsApi, Version, getCppToolsApi } from 'vscode-cpptools';

import { ReCppConfigurationProvider } from './cpptools';

import { execSync } from 'child_process';

class ExtensionManager {    
    readonly api: CppToolsApi;
    readonly provider = new ReCppConfigurationProvider();

    private registered: boolean = false;
    
    constructor(api: CppToolsApi) {
        this.api = api;
    }

    notifyCppToolsMetaLoaded() {
        if (!this.registered) {
            const api = this.api;

            if (api.notifyReady) {
                // Inform cpptools that a custom config provider will be able to service the current workspace.
                api.registerCustomConfigurationProvider(this.provider);

                // Do any required setup that the provider needs.

                // Notify cpptools that the provider is ready to provide IntelliSense configurations.
                api.notifyReady(this.provider);
            } else {
                // Running on a version of cpptools that doesn't support v2 yet.

                // Do any required setup that the provider needs.

                // Inform cpptools that a custom config provider will be able to service the current workspace.
                api.registerCustomConfigurationProvider(this.provider);
                api.didChangeCustomConfiguration(this.provider);
            }
        }
        else {            
            this.api.didChangeCustomConfiguration(this.provider);
        }
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	
	let api: CppToolsApi | undefined = await getCppToolsApi(Version.latest);
	
    if (api) {
        const manager = new ExtensionManager(api);
        
        const codePath = vscode.workspace.workspaceFolders![0].uri.fsPath;
        const metaPath = codePath + '/.re-cache/meta/full.json';

        const loadMeta = () => {
            try {
                const firstTime = !manager.provider.dataLoaded;
                manager.provider.loadMeta(metaPath);

                if (firstTime)
                    vscode.window.showInformationMessage('Loaded Re metadata for project ' + manager.provider.rootTarget!);
                else
                    vscode.window.showInformationMessage('Reloaded Re metadata for project ' + manager.provider.rootTarget!);
            }
            catch (e: any) {                
                vscode.window.showErrorMessage(`Failed to load Re metadata for the current workspace:\n  ${e.toString()}`);
            }

            manager.notifyCppToolsMetaLoaded();
        };

        const regenerateMeta = async (params = 'cached-only') => {
            try {
                execSync(`re meta "${codePath}" ${params} --colors off`);
            } catch (error: any) {
                if (error.status == 5) {
                    const response = await vscode.window.showWarningMessage(
                        'The Re target has uncached dependencies that may take a while to load.',
                        'Run Anyway'
                    );

                    if (response != undefined) {
                        vscode.window.showInformationMessage('Generating Re metadata [uncached included]...');
                        await regenerateMeta('');
                    }
                }
                else {
                    vscode.window.showErrorMessage('Failed to generate Re metadata:\n    ' + error.message);
                }
            }
        };

        await regenerateMeta();
        
        let metaWatcher = vscode.workspace.createFileSystemWatcher(metaPath);
        
        metaWatcher.onDidCreate((_) => loadMeta());
        metaWatcher.onDidChange((_) => loadMeta());

        let reYmlWatcher = vscode.workspace.createFileSystemWatcher('**/re.yml');

        const regenerateMetaCallback = async (_: vscode.Uri) => await regenerateMeta();

        reYmlWatcher.onDidChange(regenerateMetaCallback);
        reYmlWatcher.onDidCreate(regenerateMetaCallback);
        reYmlWatcher.onDidDelete(regenerateMetaCallback);
        
        let reConfigWatcher = vscode.workspace.createFileSystemWatcher('**/re.user.yml');

        reConfigWatcher.onDidChange(regenerateMetaCallback);
        reConfigWatcher.onDidCreate(regenerateMetaCallback);
        reConfigWatcher.onDidDelete(regenerateMetaCallback);

        var type = "re-build-tools";

        vscode.tasks.registerTaskProvider(type, {
            provideTasks() {
                var execution = new vscode.ShellExecution("echo \"Hello World\"");
                var problemMatchers = ["$myProblemMatcher"];
                return [
                    new vscode.Task({type: type}, vscode.TaskScope.Workspace,
                        "Build", "re-build-tools", execution, problemMatchers)
                ];
            },
            resolveTask(task: vscode.Task, token?: vscode.CancellationToken) {
                return task;
            }
        });
        
        context.subscriptions.push(reConfigWatcher);
        context.subscriptions.push(reYmlWatcher);
        context.subscriptions.push(metaWatcher);

        context.subscriptions.push(api);
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
