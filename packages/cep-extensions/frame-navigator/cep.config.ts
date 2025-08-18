import { CEP_Config } from "vite-cep-plugin";
import { version } from "./package.json";

const config: CEP_Config = {
	version,
	id: 'com.frame-navigator.cep',
	displayName: '',
	symlink: 'local',
	port: 3000,
	servePort: 5000,
	startingDebugPort: 8860,
	extensionManifestVersion: 6.0,
	requiredRuntimeVersion: 9.0,
	hosts: [{ name: 'AEFT', version: '[0.0,99.9]' }],
	type: 'ModalDialog',
	iconDarkNormal: './src/assets/light-icon.png',
	iconNormal: './src/assets/dark-icon.png',
	iconDarkNormalRollOver: './src/assets/light-icon.png',
	iconNormalRollOver: './src/assets/dark-icon.png',
	parameters: ['--v=0', '--enable-nodejs', '--mixed-context'],
	width: 125,
	height: 46,
	minWidth: 125,
	minHeight: 46,
	maxWidth: 125,
	maxHeight: 46,
	standalone: true,

	panels: [
		{
			mainPath: './main/index.html',
			name: 'main',
			panelDisplayName: '\u00A0',
			autoVisible: true,
			width: 125,
			height: 46,
			minWidth: 125,
			minHeight: 46,
			maxWidth: 125,
			maxHeight: 46,
			type: 'ModalDialog'
		}
	],

	build: {
		jsxBin: 'off',
		sourceMap: true,
	},
	zxp: {
		country: 'US',
		province: 'CA',
		org: 'MyCompany',
		password: 'changeme',
		tsa: 'http://timestamp.digicert.com/',
		sourceMap: false,
		jsxBin: 'off',
	},
	installModules: [],
	copyAssets: [],
	copyZipAssets: [],
};

export default config;
