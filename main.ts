import { App, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import OpenAI from "openai";

interface LLMPluginSettings {
	openaiApiKey: string;
}

const DEFAULT_SETTINGS: LLMPluginSettings = {
	openaiApiKey: ''
}

export default class LLMPlugin extends Plugin {
	settings: LLMPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'llm-completion',
			name: 'Complete selected text',
			callback: () => {
				completeSelectedText();
			}
		});

		const completeSelectedText = async () => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				return;
			}

			const editor = activeView.editor;
			const selectedText = editor.getSelection();
			const openaiApiKey = this.settings.openaiApiKey;

			if (!openaiApiKey) {
				new Notice('OpenAI API key not set');
				return;
			} else if (!selectedText) {
				new Notice('Please select text to complete');
				return;
			} else if (!navigator.onLine) {
				new Notice('Please check your internet connection');
				return;
			}

			const openai = new OpenAI({ 
				apiKey: openaiApiKey,
				// This is required to use the plugin in the browser (Obsidian is an Electron app)
				dangerouslyAllowBrowser: true 
			});

			const response = await openai.chat.completions.create({
				messages: [
					{"role": "system", "content": "You are a helpful writing assistant. \
												  You will be provided with either a prompt, or a \
												  partially-completed piece of writing. Please complete \
												  the text that a user provides. Your only output is the \
												  text that you generate."},
					{"role": "user", "content": selectedText}],
				model: "gpt-3.5-turbo",
				stream: true
			});

			editor.setSelection(editor.getCursor("to"), editor.getCursor("to"));
			for await (const part of response) {
				editor.replaceSelection(part.choices[0]?.delta?.content || '');
				editor.setSelection(editor.getCursor("to"), editor.getCursor("to"));
			}
		}

		// This adds a settings tab so the user can configure their API key
		this.addSettingTab(new LLMSettingsTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class LLMSettingsTab extends PluginSettingTab {
	plugin: LLMPlugin;

	constructor(app: App, plugin: LLMPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('You can get your API key from https://platform.openai.com/account/api-keys')
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.openaiApiKey)
				.onChange(async (value) => {

					if (!/^sk-[a-zA-Z0-9]{32,}$/.test(value)) {
						new Notice('Invalid OpenAI API key format');
						return;
					}

					this.plugin.settings.openaiApiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}
