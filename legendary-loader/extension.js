import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context) {
    // Register command handler for new chat sessions
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            if (editor?.document.uri.scheme === 'vscode-chat') {
                await loadAndPastePrompt();
            }
        })
    );

    // Also handle initial activation
    if (vscode.window.activeTextEditor?.document.uri.scheme === 'vscode-chat') {
        loadAndPastePrompt();
    }
}

async function loadAndPastePrompt() {
    try {
        // Read the legendary prompt
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            console.error('No workspace folders found');
            return;
        }

        const promptPath = path.join(workspaceFolders[0].uri.fsPath, 'docs', 'legendary_system_prompt.md');
        const promptContent = await fs.readFile(promptPath, 'utf-8');

        // Store current clipboard content
        const originalClipboard = await vscode.env.clipboard.readText();

        // Copy prompt to clipboard
        await vscode.env.clipboard.writeText(promptContent);

        // Send paste command
        await vscode.commands.executeCommand('editor.action.clipboardPasteAction');

        // Restore original clipboard content
        await vscode.env.clipboard.writeText(originalClipboard);

        // Send Enter key to submit the prompt
        await vscode.commands.executeCommand('workbench.action.chat.submit');
    } catch (err) {
        console.error('Failed to load and paste prompt:', err);
    }
    console.log('Legendary Loader is now active!');
    
    // Register the command
    let disposable = vscode.commands.registerCommand('legendaryLoader.loadAndPastePrompt', loadLegendaryPrompt);
    context.subscriptions.push(disposable);
    
    // Automatically run on startup after a slight delay
    setTimeout(loadLegendaryPrompt, 2000);
}

function deactivate() {}

async function checkIfAlreadyInLegendaryMode() {
    try {
        // Get the active chat editor
        await vscode.commands.executeCommand('workbench.action.chat.open');
        
        // Give VS Code a moment to focus the chat
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the chat content through clipboard
        const previousContent = await vscode.env.clipboard.readText();
        await vscode.commands.executeCommand('editor.action.selectAll');
        await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
        const chatContent = await vscode.env.clipboard.readText();
        
        // Restore previous clipboard content
        await vscode.env.clipboard.writeText(previousContent);
        
        // Check if the legendary tags are present
        return chatContent.includes('#legendary-dev') &&
               chatContent.includes('#SRPL') &&
               chatContent.includes('#MCP-enabled');
    } catch (error) {
        return false;
    }
}

export function activate(context) {
    const loadAndPastePrompt = vscode.commands.registerCommand(
        'legendaryLoader.loadAndPastePrompt',
        async () => {
            // Check if already in Legendary Mode
            const isLegendaryMode = await checkIfAlreadyInLegendaryMode();
            if (isLegendaryMode) {
                vscode.window.showInformationMessage('Claude is already in Legendary Mode! 🧠');
                return;
            }

            const promptPath = path.join(context.extensionPath, 'docs', 'legendary_system_prompt.md');

            if (!fs.existsSync(promptPath)) {
                vscode.window.showErrorMessage('Legendary prompt file not found.');
                return;
            }

            const prompt = fs.readFileSync(promptPath, 'utf8');

            // Copy prompt to clipboard
            await vscode.env.clipboard.writeText(prompt);

            // Open Claude 3.5 Sonnet chat
            await vscode.commands.executeCommand('workbench.action.chat.open');

            // Give VS Code a moment to focus the chat input
            setTimeout(async () => {
                try {
                    // Paste the prompt into the chat input
                    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');

                    // Send the prompt automatically
                    await vscode.commands.executeCommand('workbench.action.chat.acceptInput');
                    
                    vscode.window.showInformationMessage('Legendary Mode activated! 🧠');
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to activate Legendary Mode. Please try again.');
                }
            }, 1000);
        }
    );

    context.subscriptions.push(loadAndPastePrompt);

    // Run automatically on VS Code startup with a delay
    setTimeout(() => {
        vscode.commands.executeCommand('legendaryLoader.loadAndPastePrompt');
    }, 2000);
}

export function deactivate() {}

export function deactivate() {}
