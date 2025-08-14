declare class CSInterface {
    constructor();
    getHostEnvironment(): {
        appName: string;
        appVersion: string;
        appLocale: string;
        appUILocale: string;
        appId: string;
        extensionId: string;
        extensionName: string;
        extensionVersion: string;
        platform: string;
        capabilities: {
            EXTENDED_STYLING: boolean;
            SYSTEM_COLORS: boolean;
            UNICODE_ENTRY: boolean;
            EXTENDED_DIALOG: boolean;
            SYSTEM_MENU: boolean;
            PANEL_MENU: boolean;
            BOUNDS_CHANGED_EVENT: boolean;
            WINDOW_CHANGED_EVENT: boolean;
            NETWORK_REQUESTS: boolean;
            EXTENDED_PANEL_MENU: boolean;
            EXTENDED_CONTEXT_MENU: boolean;
        };
    };
    evalScript(script: string, callback?: (result: any) => void): void;
}

declare const csInterface: CSInterface; 