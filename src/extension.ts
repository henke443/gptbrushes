// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode from 'vscode'
import { StorageService } from './util/storage'
import { getConfig, activateConfig } from './config/config'
import { activateSelectionHelper } from './util/selection'
import { outputChannel } from './util/channel'
import { activateApiKey } from './openai-api'
import { activateUseBrush } from './brush/use-brush'

export async function activate(context: vscode.ExtensionContext) {
  const storageManager = new StorageService(context.globalState)

  const sync = vscode.workspace.getConfiguration('gptbrushes').get<boolean>('syncConfig', false)
  if (sync) {
    context.globalState.setKeysForSync([
      'gptbrushes.config.brushes',
      'gptbrushes.config.categories',
      'gptbrushes.config.requestOptions',
    ])
  }

  const config = await getConfig(storageManager)
  const brushTreeDataProvider = activateConfig(context, storageManager) // registers edit and delete commands

  if (!config.brushes.length) {
    await vscode.window.showErrorMessage(
      'No brushes in the config! Could not start extension. This should never happen, ever'
    )
    return
  }

  activateApiKey(context)

  const sel = activateSelectionHelper(context, storageManager)

  activateUseBrush(storageManager, context, sel)

  const treeView = vscode.window.createTreeView('gptbrushes.brushList', {
    treeDataProvider: brushTreeDataProvider,
  })

  sel.savedSelectionEvents.addListener(() => brushTreeDataProvider.refresh())

  treeView.title = 'GPT-4 Brushes!'
  treeView.message = 'Select some text and click a brush to use it.'

  outputChannel.appendLine('GPT-4 Brushes extension activated.')
}

export function deactivate() {
  outputChannel.appendLine('GPT-4 Brushes extension deactivated.')
}
