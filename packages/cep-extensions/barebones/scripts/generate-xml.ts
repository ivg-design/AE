import { config } from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateManifest = () => {
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="6.0" ExtensionBundleId="${config.extension.id}" ExtensionBundleVersion="${config.extension.version}"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ExtensionList>
        <Extension Id="${config.extension.id}.panel" Version="${config.extension.version}" />
    </ExtensionList>
    <ExecutionEnvironment>
        <HostList>
            <Host Name="${config.host.name}" Version="${config.host.version}" />
        </HostList>
        <LocaleList>
            <Locale Code="All" />
        </LocaleList>
        <RequiredRuntimeList>
            <RequiredRuntime Name="CSXS" Version="9.0" />
        </RequiredRuntimeList>
    </ExecutionEnvironment>
    <DispatchInfoList>
        <Extension Id="${config.extension.id}.panel">
            <DispatchInfo >
                <Resources>
                    <MainPath>./index.html</MainPath>
                    <ScriptPath>./host/index.jsx</ScriptPath>
                    <CEFCommandLine>
                        <Parameter>--enable-nodejs</Parameter>
                        <Parameter>--remote-debugging-port=${config.ports.cef}</Parameter>
                    </CEFCommandLine>
                </Resources>
                <Lifecycle>
                    <AutoVisible>true</AutoVisible>
                </Lifecycle>
                <UI>
                    <Type>Panel</Type>
                    <Menu>${config.extension.name}</Menu>
                    <Geometry>
                        <Size>
                            <Height>500</Height>
                            <Width>350</Width>
                        </Size>
                    </Geometry>
                </UI>
            </DispatchInfo>
        </Extension>
    </DispatchInfoList>
</ExtensionManifest>`;

  fs.writeFileSync(path.resolve(__dirname, '../CSXS/manifest.xml'), manifest);
};

const generateDebug = () => {
  const debug = `<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="${config.extension.id}.panel">
        <HostList>
            <Host Name="${config.host.name}" Port="${config.ports.cef}"/>
        </HostList>
    </Extension>
</ExtensionList>`;

  fs.writeFileSync(path.resolve(__dirname, '../.debug/debug.xml'), debug);
};

// Generate both XML files
generateManifest();
generateDebug(); 