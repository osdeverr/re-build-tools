import * as vscode from 'vscode';
import { CustomConfigurationProvider, SourceFileConfiguration, SourceFileConfigurationItem, WorkspaceBrowseConfiguration } from 'vscode-cpptools';

import { readFileSync } from 'fs';

export class ReCppConfigurationProvider implements CustomConfigurationProvider {
    readonly name = 'Re Build Tools';
    readonly extensionId = 're.build-tools';

    private configs = new Map<string, any>();
    private configKeys: string[] = []

    constructor() {
        const data = JSON.parse(readFileSync(vscode.workspace.workspaceFolders![0].uri.fsPath + '/re-meta.json', { encoding: 'utf-8' }));

        this.configKeys = Object.keys(data).sort((a, b) => {
            if (a.length < b.length)
                return 1;
            else if (a.length > b.length)
                return -1;
            else
                return 0;
        });

        console.log(this.configKeys);

        for (const [key, value] of Object.entries(data)) {
            this.configs.set(key, value);
        }
    }

    async canProvideConfiguration(uri: vscode.Uri, token?: vscode.CancellationToken) {
        return true;
    }

    private findMostFittingTargetMeta(path: string): any { 
        for (const key of this.configKeys) {
            if (path.toLowerCase().startsWith(key.toLowerCase())) {
                const meta = this.configs.get(key);

                if (!meta) {
                    console.warn(`invalid meta key ${key} for uri ${path}`)
                    continue;
                }

                return meta;
            }
        }
    }

    async provideConfigurations(uris: vscode.Uri[]) {
        try {
            const arr: SourceFileConfigurationItem[] = [];

            for (const uri of uris) {
                const meta = this.findMostFittingTargetMeta(uri.fsPath);
                if (!meta) {
                    console.warn(`failed to find meta for uri ${uri.fsPath}`)
                    continue;
                }
            
                const cxx = meta['cxx'];
                if (!cxx)
                    continue;

                console.log(`found meta for uri ${uri.fsPath}: re module ${meta.module}`)
            
                const configuration: SourceFileConfiguration = {
                    includePath: cxx['include_dirs'],
                    defines: cxx['definitions'],
                    standard: cxx['standard'] == 'c++latest' ? 'c++20' : cxx['standard'],
                    compilerPath: cxx['tools']['compiler']
                };

                arr.push({
                    uri: uri,
                    configuration: configuration
                });
            }

            return arr;
        }
        catch (error)
        {
            console.error(error);
            return [];
        }
    }

    async canProvideBrowseConfiguration() {
        return true;
    }

    async provideBrowseConfiguration() {
        const path = vscode.workspace.workspaceFolders![0].uri.fsPath;
        const meta = this.findMostFittingTargetMeta(path);

        if (!meta) {
            console.warn(`failed to find meta for uri ${path}`)
            return null;
        }

        const cxx = meta['cxx'];
        if (!cxx)
            return null;

        return {
            browsePath: cxx['include_dirs'],
            standard: cxx['standard'] == 'c++latest' ? 'c++20' : cxx['standard'],
            compilerPath: cxx['tools']['compiler']
        };
    }

    async canProvideBrowseConfigurationsPerFolder() {
        return false; //throw new Error('Method not implemented.');
    }
    
    async provideFolderBrowseConfiguration() {
        return null; //throw new Error('Method not implemented.');
    }

    dispose() {}
}
