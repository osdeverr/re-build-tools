import * as vscode from 'vscode';
import { ReCppConfigurationProvider } from './cpptools';

export class ReTaskProvider implements vscode.TaskProvider {
    private readonly provider: ReCppConfigurationProvider;

    constructor(provider: ReCppConfigurationProvider) {
        this.provider = provider;
    }

    provideTasks(token: vscode.CancellationToken): vscode.ProviderResult<vscode.Task[]> {
        if (!this.provider.dataLoaded)
            return null;
        
        
    }

    resolveTask(task: vscode.Task, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Task> {
        return null;
    }

    /*
    async resolveTask(task: vscode.Task) {
        return [];
    }
    */
}
