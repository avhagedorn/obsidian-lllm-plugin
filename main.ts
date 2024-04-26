import { completeFactory } from 'src/complete/complete';
import { App, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { isValidAnthropicApiKey, isValidOpenAIKey, isValidGeminiApiKey } from 'src/utils';

export type LLMProvider = 'OpenAI' | 'Anthropic' | 'Gemini';

interface LLMPluginSettings {
	provider: LLMProvider;
	openaiApiKey?: string;
	anthropicApiKey?: string;
	geminiApiKey?: string;
}

const DEFAULT_SETTINGS: LLMPluginSettings = {
	provider: 'OpenAI'
}

export default class LLMPlugin extends Plugin {
	settings: LLMPluginSettings;

	getApiKey = (provider: LLMProvider) => {
		switch (provider) {
			case 'OpenAI':
				return this.settings.openaiApiKey;
			case 'Anthropic':
				return this.settings.anthropicApiKey;
			case 'Gemini':
				return this.settings.geminiApiKey;
			default:
				return undefined;
		}
	}

	completeSelectedText = async () => {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			return;
		}

		const editor = activeView.editor;
		const selectedText = editor.getSelection();
		const apiKey = this.getApiKey(this.settings.provider);

		if (apiKey === undefined) {
			new Notice(`No ${this.settings.provider} API key found!`)
			return;
		} else if (!selectedText) {
			new Notice('Please select text to complete');
			return;
		} else if (!navigator.onLine) {
			new Notice('Please check your internet connection');
			return;
		}

		const response = await completeFactory(
			selectedText, 
			this.settings.provider,
			apiKey
		);

		editor.setSelection(editor.getCursor("to"), editor.getCursor("to"));

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const { done, value } = await response.read();
			console.log(done, value);
			if (done) break;
			editor.replaceSelection(value);
			editor.setSelection(editor.getCursor("to"), editor.getCursor("to"));
		}
	}

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'llm-completion',
			name: 'Complete selected text',
			callback: this.completeSelectedText
		});

		// this.addCommand({
		// 	id: 'llm-rewrite',
		// 	name: 'Rewrite selected text',
		// 	callback: this.rewriteSelectedText
		// })

		// This adds a settings tab so the user can configure their API key
		this.addSettingTab(new LLMSettingsTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{}, DEFAULT_SETTINGS, await this.loadData()
		);
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
			.setName("LLM Provider")
			.addDropdown(dropdown => dropdown
				.addOptions({
					'OpenAI': 'OpenAI',
					// 'Anthropic': 'Anthropic',
					'Gemini': 'Gemini'
				})
				.setValue(this.plugin.settings.provider)
				.onChange(async (value) => {
					this.plugin.settings.provider = value as LLMProvider;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('You can get your API key from https://platform.openai.com/account/api-keys')
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.openaiApiKey || '')
				.onChange(async (value) => {

					if (!isValidOpenAIKey(value)) {
						new Notice('Invalid OpenAI API key format');
						return;
					}

					this.plugin.settings.openaiApiKey = value;
					await this.plugin.saveSettings();
				}));

		// new Setting(containerEl)
		// 	.setName('Anthropic API Key')
		// 	.setDesc('You can get your API key from https://console.anthropic.com/settings/keys')
		// 	.addText(text => text
		// 		.setPlaceholder('sk-ant-api...')
		// 		.setValue(this.plugin.settings.anthropicApiKey || '')
		// 		.onChange(async (value) => {

		// 			if (!isValidAnthropicApiKey(value)) {
		// 				new Notice('Invalid Anthropic API key format');
		// 				return;
		// 			}

		// 			this.plugin.settings.anthropicApiKey = value;
		// 			await this.plugin.saveSettings();
		// 		}));

		new Setting(containerEl)
			.setName('Gemini API Key')
			.setDesc('You can get your API key from https://aistudio.google.com/app/apikey')
			.addText(text => text
				.setPlaceholder('AIzaSy...')
				.setValue(this.plugin.settings.geminiApiKey || '')
				.onChange(async (value) => {

					if (!isValidGeminiApiKey(value)) {
						new Notice('Invalid Gemini API key format');
						return;
					}

					this.plugin.settings.geminiApiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}
