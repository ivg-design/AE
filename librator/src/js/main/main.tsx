import { useEffect, useState } from "react";
import ReactDOM from 'react-dom/client'; // Ensure this is correctly imported
import { Text } from '@react-spectrum/typography'; // Import Text from the correct package
import { os, path } from "../lib/cep/node";
import { Provider, defaultTheme, Flex, Heading, TextField, ActionButton, Divider, ListBox, Item } from '@adobe/react-spectrum';
import { Selection, Key } from '@react-types/shared';
import "./main.scss";
import {
  csi,
  evalES,
  evalFile,
  openLinkInBrowser,
  subscribeBackgroundColor,
  evalTS,
} from "../lib/utils/bolt";
import CSInterface from '../lib/cep/csinterface';

const Main = () => {
	const [expressions, setExpressions] = useState<string[]>([]);
	const [currentExpression, setCurrentExpression] = useState<string>('');
	const [selectedExpression, setSelectedExpression] = useState<string | null>(null);
	const [statusMessage, setStatusMessage] = useState<string>('');
	
useEffect(() => {
	if (typeof CSInterface !== 'undefined') {
		const csInterface = new CSInterface();
		csInterface.evalScript('librator.jsx', (result:any) => {
			console.log(result);
		});
	} else {
		console.warn('Running outside of an Adobe environment.');
	}
}, []);

	const loadExpressions = async () => {
		try {
			const result = await evalES('getExpressions()');
			const loadedExpressions: string[] = JSON.parse(result);
			setExpressions(loadedExpressions);
		} catch (error) {
			setStatusMessage('Failed to load expressions.');
		}
	};

	const saveExpression = async () => {
		try {
			const result = await evalES(`saveExpression('${currentExpression}')`);
			if (result === 'success') {
				loadExpressions();
				setCurrentExpression('');
				setStatusMessage('Expression saved successfully.');
			} else {
				setStatusMessage('Failed to save expression.');
			}
		} catch (error) {
			setStatusMessage('Failed to save expression.');
		}
	};

	const applyExpression = async () => {
		if (selectedExpression) {
			try {
				await evalES(`applyExpression('${selectedExpression}')`);
				setStatusMessage('Expression applied successfully.');
			} catch (error) {
				setStatusMessage('Failed to apply expression.');
			}
		}
	};

	const handleSelectionChange = (keys: Selection) => {
		const selectedKey = Array.from(keys as Set<Key>)[0];
		if (typeof selectedKey === 'string') {
			setSelectedExpression(selectedKey);
		}
	};

	useEffect(() => {
		loadExpressions();
	}, []);

	return (
		<Provider theme={defaultTheme}>
			<Flex direction="column" gap="size-100" alignItems="center" justifyContent="center">
				<Heading level={1}>Expression Librarian</Heading>
				<TextField label="Expression" width="size-4600" value={currentExpression} onChange={setCurrentExpression} />
				<Flex gap="size-100">
					<ActionButton onPress={saveExpression}>Save</ActionButton>
					<ActionButton onPress={applyExpression} isDisabled={!selectedExpression}>
						Apply
					</ActionButton>
				</Flex>
				<Divider size="S" />
				<ListBox
					width="size-4600"
					selectionMode="single"
					aria-label="Select Expression"
					items={expressions.map((expr) => ({ key: expr, name: expr }))}
					selectedKeys={selectedExpression ? new Set([selectedExpression]) : undefined}
					onSelectionChange={handleSelectionChange}>
					{expressions.map((expr) => (
						<Item key={expr}>{expr}</Item>
					))}
				</ListBox>
				<Heading level={4}>{statusMessage}</Heading>
			</Flex>
		</Provider>
	);
};

export default Main;